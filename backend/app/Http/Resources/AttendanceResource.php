<?php

namespace App\Http\Resources;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Attendance
 */
class AttendanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => $this->whenLoaded('employee', fn (): array => [
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'full_name' => $this->employee->fullName(),
                'employee_number' => $this->employee->employee_number,
            ]),
            'attendance_date' => $this->attendance_date?->toDateString(),
            'first_entry' => $this->first_entry,
            'last_exit' => $this->last_exit,
            'break_starts_at' => $this->scheduledBreakTime('break_starts_at'),
            'break_ends_at' => $this->scheduledBreakTime('break_ends_at'),
            'worked_minutes' => $this->worked_minutes,
            'late_minutes' => $this->late_minutes,
            'overtime_minutes' => $this->overtime_minutes,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }

    private function scheduledBreakTime(string $column): ?string
    {
        if (! $this->relationLoaded('employee') || ! $this->employee->relationLoaded('workSchedules')) {
            return null;
        }

        $dayOfWeek = $this->attendance_date?->isoWeekday();

        if ($dayOfWeek === null) {
            return null;
        }

        $schedule = $this->employee->workSchedules
            ->first()
            ?->workSchedule;

        if ($schedule === null || ! $schedule->is_active || ! $schedule->relationLoaded('days')) {
            return null;
        }

        $day = $schedule->days->firstWhere('day_of_week', $dayOfWeek);

        return $day?->{$column} === null ? null : substr($day->{$column}, 0, 5);
    }
}
