<?php

namespace App\Http\Resources;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Department
 */
class DepartmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'direction_id' => $this->direction_id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'direction' => $this->whenLoaded('direction', fn () => [
                'id' => $this->direction->id,
                'name' => $this->direction->name,
            ]),
            'employees_count' => $this->whenCounted('employees'),
        ];
    }
}
