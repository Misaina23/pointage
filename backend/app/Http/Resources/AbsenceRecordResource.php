<?php

namespace App\Http\Resources;

use App\Models\AbsenceRecord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AbsenceRecord
 */
class AbsenceRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'absence_type_id' => $this->absence_type_id,
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'reason' => $this->reason,
            'attachment_path' => $this->attachment_path,
            'status' => $this->status,
            'absence_type' => $this->whenLoaded('absenceType', fn () => [
                'id' => $this->absenceType->id,
                'name' => $this->absenceType->name,
                'code' => $this->absenceType->code,
            ]),
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'employee_number' => $this->employee->employee_number,
                'full_name' => $this->employee->fullName(),
            ]),
        ];
    }
}
