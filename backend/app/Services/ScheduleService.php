<?php

namespace App\Services;

use App\Data\ScheduledShift;
use App\Models\Employee;
use App\Models\EmployeeWorkSchedule;
use App\Models\Holiday;
use App\Models\WorkSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ScheduleService
{
    private const DEFAULT_SHIFT_START = '08:00:00';

    private const DEFAULT_LATE_TOLERANCE_MINUTES = 10;

    public function isHoliday(CarbonImmutable $date): bool
    {
        return Holiday::query()->whereDate('date', $date->toDateString())->exists();
    }

    public function holidayFor(CarbonImmutable $date): ?Holiday
    {
        return Holiday::query()->whereDate('date', $date->toDateString())->first();
    }

    public function holidaysBetween(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return Holiday::query()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('date')
            ->get();
    }

    public function activeAssignmentFor(Employee $employee, CarbonImmutable $date): ?EmployeeWorkSchedule
    {
        return EmployeeWorkSchedule::query()
            ->where('employee_id', $employee->id)
            ->whereDate('starts_on', '<=', $date->toDateString())
            ->where(fn ($query) => $query
                ->whereNull('ends_on')
                ->orWhereDate('ends_on', '>=', $date->toDateString()))
            ->orderByDesc('starts_on')
            ->first();
    }

    public function scheduleFor(Employee $employee, CarbonImmutable $date): ?WorkSchedule
    {
        $assignment = $this->activeAssignmentFor($employee, $date);

        if (! $assignment) {
            return null;
        }

        return WorkSchedule::query()
            ->with('days')
            ->find($assignment->work_schedule_id);
    }

    public function resolveShift(Employee $employee, CarbonImmutable $date): ?ScheduledShift
    {
        $schedule = $this->scheduleFor($employee, $date);

        if (! $schedule || ! $schedule->is_active) {
            return $this->defaultShift($date);
        }

        $day = $schedule->days->firstWhere('day_of_week', $date->isoWeekday());

        if (! $day || $day->starts_at === null) {
            return $this->defaultShift($date);
        }

        return new ScheduledShift(
            date: $date,
            startsAt: $this->timeOn($date, $day->starts_at),
            endsAt: $this->timeOn($date, $day->ends_at),
            breakStartsAt: $this->timeOn($date, $day->break_starts_at),
            breakEndsAt: $this->timeOn($date, $day->break_ends_at),
            lateToleranceMinutes: $schedule->late_tolerance_minutes,
            isRestDay: false,
        );
    }

    private function defaultShift(CarbonImmutable $date): ScheduledShift
    {
        return new ScheduledShift(
            date: $date,
            startsAt: $this->timeOn($date, self::DEFAULT_SHIFT_START),
            endsAt: null,
            breakStartsAt: null,
            breakEndsAt: null,
            lateToleranceMinutes: self::DEFAULT_LATE_TOLERANCE_MINUTES,
            isRestDay: false,
        );
    }

    /**
     * Jours ouvrés (hors dimanche) sur la période, used pour le calcul des jours de congé.
     *
     * @return Collection<int, CarbonImmutable>
     */
    public function workingDays(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $holidays = $this->holidaysBetween($from, $to)->pluck('date')
            ->map(fn ($date): string => CarbonImmutable::parse($date)->toDateString())
            ->all();

        $days = collect();
        $cursor = $from->startOfDay();

        while ($cursor->lessThanOrEqualTo($to->startOfDay())) {
            if ($cursor->dayOfWeek !== CarbonImmutable::SUNDAY && ! in_array($cursor->toDateString(), $holidays, true)) {
                $days->push($cursor);
            }

            $cursor = $cursor->addDay();
        }

        return $days;
    }

    public function countWorkingDays(CarbonImmutable $from, CarbonImmutable $to): int
    {
        if ($to->lessThan($from)) {
            return 0;
        }

        return $this->workingDays($from, $to)->count();
    }

    public function permissionDays(Employee $employee, CarbonImmutable $date, string $startsAt, string $endsAt): float
    {
        $shift = $this->resolveShift($employee, $date);

        if (! $shift || ! $shift->hasHours() || $shift->expectedMinutes() === 0) {
            throw ValidationException::withMessages([
                'permission_date' => 'Aucun horaire de travail actif ne permet de calculer cette permission.',
            ]);
        }

        $requestedStart = $date->setTimeFromTimeString($startsAt);
        $requestedEnd = $date->setTimeFromTimeString($endsAt);
        $shiftStart = $shift->expectedEntryAt();
        $shiftEnd = $shift->expectedExitAt();
        $start = $requestedStart->greaterThan($shiftStart) ? $requestedStart : $shiftStart;
        $end = $requestedEnd->lessThan($shiftEnd) ? $requestedEnd : $shiftEnd;
        $minutes = max(0, (int) $start->diffInMinutes($end, false));

        if ($shift->breakStartsAt !== null && $shift->breakEndsAt !== null) {
            $breakStart = $date->setTimeFromTimeString($shift->breakStartsAt->format('H:i:s'));
            $breakEnd = $date->setTimeFromTimeString($shift->breakEndsAt->format('H:i:s'));
            $overlapStart = $start->greaterThan($breakStart) ? $start : $breakStart;
            $overlapEnd = $end->lessThan($breakEnd) ? $end : $breakEnd;

            if ($overlapEnd->greaterThan($overlapStart)) {
                $minutes -= (int) $overlapStart->diffInMinutes($overlapEnd, false);
            }
        }

        if ($minutes <= 0) {
            throw ValidationException::withMessages([
                'starts_at' => 'La plage horaire ne correspond à aucune heure de travail.',
            ]);
        }

        return round($minutes / $shift->expectedMinutes(), 2);
    }

    private function timeOn(CarbonImmutable $date, ?string $time): ?CarbonImmutable
    {
        if ($time === null) {
            return null;
        }

        return CarbonImmutable::createFromFormat('H:i:s', $time, $date->timezone)
            ?->setDate($date->year, $date->month, $date->day);
    }
}
