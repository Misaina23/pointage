<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\EmployeeStatus;
use App\Models\Employee;
use App\Services\EmployeeAccessService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationRule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Employee::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'direction_id' => ['nullable', 'integer', 'exists:directions,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'position_title' => ['nullable', 'string', 'max:150'],
            'manager_id' => ['nullable', 'integer', 'exists:employees,id'],
            'is_top_level' => ['sometimes', 'boolean'],
            'employee_number' => ['required', 'string', 'max:50', 'unique:employees,employee_number'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255', 'unique:employees,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'hire_date' => ['nullable', 'date'],
            'employment_type' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(array_column(EmployeeStatus::cases(), 'value'))],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->filled('direction_id') && $this->filled('department_id')) {
                $validator->errors()->add(
                    'department_id',
                    'Choisissez une direction ou un département, pas les deux.',
                );
            }

            if ($this->isMethod('post') && ! $this->filled('direction_id') && ! $this->filled('department_id')) {
                $validator->errors()->add(
                    'direction_id',
                    'Choisissez une direction ou un département.',
                );
            }

            if (
                $this->filled('manager_id')
                && $this->route('employee') !== null
                && (int) $this->input('manager_id') === (int) $this->route('employee')->id
            ) {
                $validator->errors()->add('manager_id', 'Un employé ne peut pas être son propre responsable direct.');
            }

            if ($this->isMethod('post') && ! $this->filled('manager_id') && ! $this->boolean('is_top_level')) {
                $validator->errors()->add(
                    'manager_id',
                    'Sélectionnez un responsable direct ou indiquez que cet employé est au premier niveau hiérarchique.',
                );
            }

            if ($this->boolean('is_top_level') && $this->filled('manager_id')) {
                $validator->errors()->add(
                    'manager_id',
                    'Un employé du premier niveau hiérarchique ne peut pas avoir de responsable direct.',
                );
            }

            $employee = $this->route('employee');
            $directionId = $this->exists('direction_id')
                ? ($this->filled('direction_id') ? $this->integer('direction_id') : null)
                : $employee?->direction_id;
            $departmentId = $this->exists('department_id')
                ? ($this->filled('department_id') ? $this->integer('department_id') : null)
                : $employee?->department_id;
            $managerId = $this->exists('manager_id')
                ? ($this->filled('manager_id') ? $this->integer('manager_id') : null)
                : $employee?->manager_id;

            if (! app(EmployeeAccessService::class)->canAssignEmployee(
                $this->user(),
                $directionId,
                $departmentId,
                $managerId,
            )) {
                $field = $this->filled('manager_id')
                    && (int) $this->input('manager_id') !== (int) $this->user()->employee?->id
                    ? 'manager_id'
                    : ($this->exists('direction_id')
                        ? 'direction_id'
                        : ($departmentId !== null ? 'department_id' : 'direction_id'));

                $validator->errors()->add(
                    $field,
                    'Vous ne pouvez pas affecter un employé à cette direction, ce département ou ce responsable.',
                );
            }
        });
    }
}
