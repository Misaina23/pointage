<?php

namespace Tests\Feature;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceAnomaly;
use App\Models\Badge;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\ScheduleDay;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\InteractsWithPointaData;
use Tests\TestCase;

class AttendanceCalculationTest extends TestCase
{
    use InteractsWithPointaData;
    use RefreshDatabase;

    public function test_arrival_within_tolerance_is_present_and_late_arrival_is_measured(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $this->scan($employee, 'entry', '08:05', $date);
        $this->scan($employee, 'exit', '17:00', $date);

        $result = $attendance->recompute($employee, $date);

        $this->assertSame('present', $result->status);
        $this->assertSame(0, $result->late_minutes);
        $this->assertSame(475, $result->worked_minutes);
    }

    public function test_arrival_after_tolerance_produces_late_minutes(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $this->scan($employee, 'entry', '08:45', $date);
        $this->scan($employee, 'exit', '17:00', $date);

        $result = $attendance->recompute($employee, $date);

        $this->assertSame('late', $result->status);
        $this->assertSame(45, $result->late_minutes);
        $this->assertSame('Retard', AttendanceStatus::tryFrom($result->status)?->label());
    }

    public function test_overtime_is_computed_from_the_expected_exit(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $this->scan($employee, 'entry', '08:00', $date);
        $this->scan($employee, 'exit', '18:30', $date);

        $result = $attendance->recompute($employee, $date);

        $this->assertSame(90, $result->overtime_minutes);
        $this->assertSame(570, $result->worked_minutes);
    }

    public function test_day_without_events_is_absent_and_raises_an_anomaly(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $result = $attendance->recompute($employee, $date);

        $this->assertSame('absent', $result->status);
        $this->assertDatabaseHas('attendance_anomalies', [
            'employee_id' => $employee->id,
            'type' => 'missing_entry',
            'status' => 'open',
        ]);
    }

    public function test_today_attendance_response_includes_the_employee_scheduled_break(): void
    {
        $date = CarbonImmutable::now();
        $employee = $this->makeEmployee();
        $schedule = $this->makeStandardSchedule();

        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => $date->toDateString(),
        ]);
        ScheduleDay::query()->updateOrCreate(
            [
                'work_schedule_id' => $schedule->id,
                'day_of_week' => $date->isoWeekday(),
            ],
            [
                'starts_at' => '08:00:00',
                'ends_at' => '17:00:00',
                'break_starts_at' => '12:00:00',
                'break_ends_at' => '13:00:00',
            ],
        );
        $employee->attendances()->create([
            'attendance_date' => $date->toDateString(),
            'first_entry' => '08:03:00',
            'last_exit' => '17:12:00',
            'worked_minutes' => 489,
            'late_minutes' => 0,
            'overtime_minutes' => 12,
            'status' => AttendanceStatus::Present->value,
        ]);

        $response = $this->withToken($this->token('administrateur'))
            ->getJson('/api/v1/attendance/today?date='.$date->toDateString())
            ->assertOk();

        $response->assertJsonPath('attendances.0.break_starts_at', '12:00')
            ->assertJsonPath('attendances.0.break_ends_at', '13:00');
    }

    public function test_entry_without_exit_raises_a_missing_exit_anomaly(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $this->scan($employee, 'entry', '08:00', $date);
        $attendance->recompute($employee, $date);

        $this->assertDatabaseHas('attendance_anomalies', [
            'employee_id' => $employee->id,
            'type' => 'missing_exit',
        ]);
    }

    public function test_missing_exit_anomaly_is_resolved_after_exit_is_recorded(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        $this->scan($employee, 'entry', '08:00', $date);
        $attendance->recompute($employee, $date);

        $anomaly = AttendanceAnomaly::query()
            ->where('employee_id', $employee->id)
            ->where('attendance_date', $date->toDateString())
            ->where('type', 'missing_exit')
            ->firstOrFail();
        $this->assertSame('open', $anomaly->status);

        $this->scan($employee, 'exit', '17:00', $date);
        $attendance->recompute($employee, $date);
        $anomaly->refresh();

        $this->assertSame('resolved', $anomaly->status);
        $this->assertNotNull($anomaly->resolved_at);
        $this->assertNull($anomaly->resolved_by);
    }

    public function test_holiday_marks_the_day_as_holiday(): void
    {
        $attendance = app(AttendanceService::class);
        $employee = $this->employeeWithSchedule('2026-10-05');
        $date = CarbonImmutable::parse('2026-10-05');

        Holiday::query()->create(['name' => 'Fête nationale', 'date' => '2026-10-05']);

        $this->scan($employee, 'entry', '08:00', $date);
        $result = $attendance->recompute($employee, $date);

        $this->assertSame('holiday', $result->status);
    }

    private function employeeWithSchedule(string $startsOn): Employee
    {
        $employee = $this->makeEmployee();
        $schedule = $this->makeStandardSchedule();

        $employee->workSchedules()->create([
            'work_schedule_id' => $schedule->id,
            'starts_on' => $startsOn,
        ]);

        return $employee;
    }

    private function scan(Employee $employee, string $type, string $time, CarbonImmutable $date): void
    {
        $badge = Badge::query()->create([
            'employee_id' => $employee->id,
            'public_id' => (string) Str::uuid(),
            'badge_number' => 'BADGE-'.strtoupper(Str::random(8)),
            'issued_at' => now()->subWeek(),
        ]);

        $employee->attendanceEvents()->create([
            'badge_id' => $badge->id,
            'event_type' => $type,
            'occurred_at' => $date->setTimeFromTimeString($time),
            'source' => 'security_scan',
        ]);
    }
}
