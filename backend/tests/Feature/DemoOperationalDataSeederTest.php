<?php

namespace Tests\Feature;

use App\Models\ApprovalRequest;
use App\Models\AttendanceEvent;
use App\Models\Employee;
use App\Models\PlanningEvent;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoOperationalDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DemoOperationalDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_data_is_complete_related_and_idempotent(): void
    {
        Storage::fake('public');
        $this->seed(DatabaseSeeder::class);

        $employees = Employee::query()->with('department', 'direction', 'manager')->get();

        $this->assertCount(18, $employees);
        $this->assertSame(0, $employees->filter(fn (Employee $employee): bool => blank($employee->photo_path))->count());

        foreach ($employees as $employee) {
            $this->assertTrue(Storage::disk('public')->exists($employee->photo_path));
            $this->assertTrue($employee->department !== null || $employee->direction !== null);
            $this->assertNotNull($employee->hire_date);
            $this->assertNotNull($employee->employment_type);
            $this->assertNotNull($employee->position_title);
        }

        $events = AttendanceEvent::query()
            ->with('badge', 'device')
            ->orderBy('employee_id')
            ->orderBy('occurred_at')
            ->get();
        $this->assertNotEmpty($events);

        foreach ($events as $event) {
            $this->assertNotNull($event->badge);
            $this->assertNotNull($event->device);
        }

        foreach ($events->groupBy('employee_id') as $employeeEvents) {
            $hasUnclosedEntry = false;

            foreach ($employeeEvents as $event) {
                if ($event->event_type === 'entry') {
                    $this->assertFalse($hasUnclosedEntry, 'Une entrée ne peut pas suivre une autre entrée sans sortie.');
                    $hasUnclosedEntry = true;

                    continue;
                }

                $this->assertTrue($hasUnclosedEntry, 'Une sortie doit toujours être précédée d’une entrée.');
                $hasUnclosedEntry = false;
            }
        }

        $approvals = ApprovalRequest::query()->with('employee', 'requestable')->get();
        $this->assertNotEmpty($approvals);

        foreach ($approvals as $approval) {
            $this->assertNotNull($approval->employee);
            $this->assertNotNull($approval->requestable);
        }

        $this->assertGreaterThan(0, PlanningEvent::query()->withCount('participants')->whereHas('participants')->count());
        $this->assertGreaterThan(0, Employee::query()->whereHas('leaveBalances')->count());

        $countsBeforeReseed = [
            'employees' => Employee::query()->count(),
            'attendance_events' => AttendanceEvent::query()->count(),
            'approvals' => ApprovalRequest::query()->count(),
            'planning_events' => PlanningEvent::query()->count(),
        ];

        $this->seed(DemoOperationalDataSeeder::class);

        $this->assertSame($countsBeforeReseed, [
            'employees' => Employee::query()->count(),
            'attendance_events' => AttendanceEvent::query()->count(),
            'approvals' => ApprovalRequest::query()->count(),
            'planning_events' => PlanningEvent::query()->count(),
        ]);
    }
}
