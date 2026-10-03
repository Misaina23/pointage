<?php

namespace App\Http\Resources;

use App\Models\WorkSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorkSchedule
 */
class WorkScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'schedule_type' => $this->schedule_type,
            'late_tolerance_minutes' => $this->late_tolerance_minutes,
            'is_active' => $this->is_active,
            'days' => $this->whenLoaded('days', fn () => $this->days->sortBy('day_of_week')->values()->map(fn ($day): array => [
                'day_of_week' => $day->day_of_week,
                'starts_at' => $day->starts_at,
                'ends_at' => $day->ends_at,
                'break_starts_at' => $day->break_starts_at,
                'break_ends_at' => $day->break_ends_at,
            ])),
        ];
    }
}
