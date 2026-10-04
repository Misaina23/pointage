<?php

namespace App\Services;

use App\Data\ScheduledShift;
use App\Enums\AttendanceStatus;
use App\Models\AbsenceRecord;
use App\Models\Attendance;
use App\Models\AttendanceAnomaly;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use App\Models\PlanningEvent;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class AttendanceService
{
    public function __construct(private readonly ScheduleService $schedules) {}

    /**
     * Recalcule la journée de présence d'un employé à partir des événements bruts.
     */
    public function recompute(Employee $employee, CarbonImmutable $date): Attendance
    {
        $shift = $this->schedules->resolveShift($employee, $date);
        $events = $this->eventsFor($employee, $date);

        $firstEntry = $events->where('event_type', 'entry')->min('occurred_at');
        $lastExit = $events->where('event_type', 'exit')->max('occurred_at');

        $workedMinutes = $this->workedMinutes($events, $shift);
        $lateMinutes = $this->lateMinutes($shift, $firstEntry);
        $overtimeMinutes = $this->overtimeMinutes($shift, $lastExit);
        $status = $this->statusFor(
            $employee,
            $date,
            $shift,
            $lateMinutes,
            $workedMinutes,
            $firstEntry !== null,
        );

        $attendance = Attendance::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $date->toDateString()],
            [
                'first_entry' => $firstEntry?->format('H:i:s'),
                'last_exit' => $lastExit?->format('H:i:s'),
                'worked_minutes' => $workedMinutes,
                'late_minutes' => $lateMinutes,
                'overtime_minutes' => $overtimeMinutes,
                'status' => $status->value,
                'notes' => null,
            ],
        );

        $this->detectAnomalies($employee, $date, $attendance, $events, $shift?->isRestDay ?? false);

        return $attendance;
    }

    /**
     * @return Collection<int, AttendanceEvent>
     */
    public function eventsFor(Employee $employee, CarbonImmutable $date): Collection
    {
        return AttendanceEvent::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('occurred_at', [$date->startOfDay(), $date->endOfDay()])
            ->orderBy('occurred_at')
            ->get();
    }

    public function todayFor(Employee $employee): ?Attendance
    {
        return Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', CarbonImmutable::now()->toDateString())
            ->first();
    }

    public function recomputeMany(Collection $employees, CarbonImmutable $date): Collection
    {
        return $employees->map(fn (Employee $employee): Attendance => $this->recompute($employee, $date));
    }

    public function hasApprovedLeave(Employee $employee, CarbonImmutable $date): bool
    {
        return LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereDate('starts_on', '<=', $date->toDateString())
            ->whereDate('ends_on', '>=', $date->toDateString())
            ->exists();
    }

    public function hasApprovedPermission(Employee $employee, CarbonImmutable $date): bool
    {
        return PermissionRequest::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereDate('permission_date', $date->toDateString())
            ->exists();
    }

    public function hasAbsence(Employee $employee, CarbonImmutable $date): bool
    {
        return AbsenceRecord::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate('starts_on', '<=', $date->toDateString())
            ->where(fn ($query) => $query
                ->whereNull('ends_on')
                ->orWhereDate('ends_on', '>=', $date->toDateString()))
            ->exists();
    }

    public function isRemoteDay(Employee $employee, CarbonImmutable $date): bool
    {
        return PlanningEvent::query()
            ->where('event_type', 'remote_work')
            ->whereDate('starts_at', $date->toDateString())
            ->whereHas('participants', fn ($query) => $query->whereKey($employee->id))
            ->exists();
    }

    /**
     * Minutes réellement travaillées : chaque plage entrée/sortie est diminuée des pauses qui la recoupent.
     */
    private function workedMinutes(Collection $events, ?ScheduledShift $shift): int
    {
        $breakStart = $shift?->breakStartsAt?->setDateFrom($shift->date);
        $breakEnd = $shift?->breakEndsAt?->setDateFrom($shift->date);

        $entry = null;
        $minutes = 0;

        foreach ($events as $event) {
            if ($event->event_type === 'entry') {
                $entry = $event->occurred_at;

                continue;
            }

            if ($entry === null) {
                continue;
            }

            $segment = (int) $entry->diffInMinutes($event->occurred_at, false);

            if ($breakStart !== null && $breakEnd !== null) {
                $overlapStart = $entry->greaterThan($breakStart) ? $entry : $breakStart;
                $overlapEnd = $event->occurred_at->lessThan($breakEnd) ? $event->occurred_at : $breakEnd;

                if ($overlapEnd->greaterThan($overlapStart)) {
                    $segment -= (int) $overlapStart->diffInMinutes($overlapEnd, false);
                }
            }

            $minutes += $segment;
            $entry = null;
        }

        return max(0, $minutes);
    }

    private function lateMinutes(?ScheduledShift $shift, mixed $firstEntry): int
    {
        if (! $shift || $shift->startsAt === null || $firstEntry === null) {
            return 0;
        }

        $expected = $shift->expectedEntryAt();
        $grace = $expected->addMinutes($shift->lateToleranceMinutes);

        if ($firstEntry->lessThanOrEqualTo($grace)) {
            return 0;
        }

        return max(0, (int) $expected->diffInMinutes($firstEntry, false));
    }

    private function overtimeMinutes(?ScheduledShift $shift, mixed $lastExit): int
    {
        if (! $shift || ! $shift->hasHours() || $lastExit === null) {
            return 0;
        }

        $expected = $shift->expectedExitAt();

        if ($lastExit->lessThanOrEqualTo($expected)) {
            return 0;
        }

        return (int) $expected->diffInMinutes($lastExit, false);
    }

    private function statusFor(
        Employee $employee,
        CarbonImmutable $date,
        ?ScheduledShift $shift,
        int $lateMinutes,
        int $workedMinutes,
        bool $hasEntry,
    ): AttendanceStatus {
        if ($this->schedules->isHoliday($date)) {
            return AttendanceStatus::Holiday;
        }

        if ($shift === null || $shift->isRestDay) {
            return $this->hasApprovedLeave($employee, $date) || $this->hasAbsence($employee, $date)
                ? AttendanceStatus::OnLeave
                : AttendanceStatus::RestDay;
        }

        if ($this->hasApprovedLeave($employee, $date)) {
            return AttendanceStatus::OnLeave;
        }

        if ($this->isRemoteDay($employee, $date)) {
            return AttendanceStatus::Remote;
        }

        if ($this->hasApprovedPermission($employee, $date) || $this->hasAbsence($employee, $date)) {
            return AttendanceStatus::OnPermission;
        }

        if ($workedMinutes === 0 && ! $hasEntry) {
            return AttendanceStatus::Absent;
        }

        return $lateMinutes > 0 ? AttendanceStatus::Late : AttendanceStatus::Present;
    }

    private function detectAnomalies(
        Employee $employee,
        CarbonImmutable $date,
        Attendance $attendance,
        Collection $events,
        bool $isRestDay,
    ): void {
        $entries = $events->where('event_type', 'entry')->count();
        $exits = $events->where('event_type', 'exit')->count();
        $activeAnomalies = [];

        if (! $isRestDay && $entries > $exits) {
            $activeAnomalies[] = AttendanceAnomaly::TYPE_MISSING_EXIT;
            $this->raiseAnomaly(
                $employee,
                $date,
                $attendance,
                AttendanceAnomaly::TYPE_MISSING_EXIT,
                sprintf(
                    '%d entrée(s) enregistrée(s) sans sortie correspondante le %s.',
                    $entries - $exits,
                    $date->toFormattedDateString(),
                ),
            );
        }

        if (
            ! $isRestDay
            && $entries === 0
            && $exits === 0
            && $attendance->status === AttendanceStatus::Absent->value
        ) {
            $activeAnomalies[] = AttendanceAnomaly::TYPE_MISSING_ENTRY;
            $this->raiseAnomaly(
                $employee,
                $date,
                $attendance,
                AttendanceAnomaly::TYPE_MISSING_ENTRY,
                sprintf('Aucun pointage enregistré le %s.', $date->toFormattedDateString()),
            );
        }

        AttendanceAnomaly::query()
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', $date->toDateString())
            ->whereIn('type', [
                AttendanceAnomaly::TYPE_MISSING_ENTRY,
                AttendanceAnomaly::TYPE_MISSING_EXIT,
            ])
            ->where('status', 'open')
            ->when(
                $activeAnomalies !== [],
                fn ($query) => $query->whereNotIn('type', $activeAnomalies),
            )
            ->update([
                'status' => 'resolved',
                'resolved_by' => null,
                'resolved_at' => now(),
                'updated_at' => now(),
            ]);
    }

    private function raiseAnomaly(
        Employee $employee,
        CarbonImmutable $date,
        Attendance $attendance,
        string $type,
        string $description,
    ): void {
        AttendanceAnomaly::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $date->toDateString(), 'type' => $type],
            [
                'attendance_id' => $attendance->id,
                'description' => $description,
                'status' => 'open',
                'resolved_by' => null,
                'resolved_at' => null,
            ],
        );
    }
}
