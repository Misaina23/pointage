<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceEventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'occurred_at' => $this->occurred_at?->toIso8601String(),
            'employee' => [
                'id' => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'direction_id' => $this->employee->direction_id,
                'department_id' => $this->employee->department_id,
            ],
            'badge_number' => $this->badge?->badge_number,
            'device_code' => $this->device?->device_code,
            'scanned_by' => $this->whenLoaded('scannedBy', fn () => $this->scannedBy === null ? null : [
                'id' => $this->scannedBy->id,
                'name' => $this->scannedBy->name,
            ]),
        ];
    }
}
