<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\EmployeeStatus;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationRule;

class UpdateEmployeeRequest extends StoreEmployeeRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('employee'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $employee = $this->route('employee');

        return array_merge(parent::rules(), [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'employee_number' => ['required', 'string', 'max:50', Rule::unique('employees', 'employee_number')->ignore($employee?->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employee?->id)],
            'status' => ['required', Rule::in(array_column(EmployeeStatus::cases(), 'value'))],
        ]);
    }
}
