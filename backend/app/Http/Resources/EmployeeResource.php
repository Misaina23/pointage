<?php

namespace App\Http\Resources;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Employee
 */
class EmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->fullName(),
            'email' => $this->email,
            'phone' => $this->phone,
            'photo_url' => $this->photo_path === null
                ? null
                : Storage::disk('public')->url($this->photo_path),
            'hire_date' => $this->hire_date?->toDateString(),
            'employment_type' => $this->employment_type,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'direction' => $this->whenLoaded('direction', fn () => $this->direction === null ? null : [
                'id' => $this->direction->id,
                'name' => $this->direction->name,
                'code' => $this->direction->code,
            ]),
            'department' => $this->whenLoaded('department', fn () => $this->department === null ? null : [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ]),
            'position_title' => $this->position_title,
            'manager' => $this->whenLoaded('manager', fn () => $this->manager === null ? null : [
                'id' => $this->manager->id,
                'full_name' => $this->manager->fullName(),
            ]),
            'badge' => $this->whenLoaded('badges', fn () => $this->badges->first() === null ? null : [
                'id' => $this->badges->first()->id,
                'badge_number' => $this->badges->first()->badge_number,
                'status' => $this->badges->first()->status->value,
            ]),
            'today' => $this->when(isset($this->today), fn () => $this->today),
        ];
    }
}
