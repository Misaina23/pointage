<?php

namespace App\Http\Resources;

use App\Models\PlanningEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PlanningEvent
 */
class PlanningEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'event_type' => $this->event_type,
            'description' => $this->description,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'location' => $this->location,
            'direction_id' => $this->direction_id,
            'department_id' => $this->department_id,
            'creator' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'participants' => $this->whenLoaded('participants', fn () => $this->participants->map(fn ($employee): array => [
                'id' => $employee->id,
                'employee_number' => $employee->employee_number,
                'full_name' => $employee->fullName(),
                'attendance_status' => $employee->pivot->attendance_status,
            ])),
        ];
    }
}
