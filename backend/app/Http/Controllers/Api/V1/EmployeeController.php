<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreEmployeeRequest;
use App\Http\Requests\Api\V1\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\AuditService;
use App\Services\EmployeeAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly EmployeeAccessService $employees,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Employee::class);

        $employees = $this->employees->limitToVisibleEmployees(
            Employee::query(),
            $request->user(),
        )
            ->with(['direction', 'department', 'manager', 'badges'])
            ->when($request->filled('search'), fn ($query) => $query->where(function ($inner) use ($request): void {
                $search = '%'.$request->string('search')->trim().'%';
                $inner->where('first_name', 'ilike', $search)
                    ->orWhere('last_name', 'ilike', $search)
                    ->orWhere('employee_number', 'ilike', $search);
            }))
            ->when($request->filled('direction_id'), fn ($query) => $query->where(function ($scope) use ($request): void {
                $directionId = $request->integer('direction_id');
                $scope->where('direction_id', $directionId)
                    ->orWhereHas('department', fn ($department) => $department->where('direction_id', $directionId));
            }))
            ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return EmployeeResource::collection($employees);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $attributes = $request->safe()->except(['attachment', 'photo', 'is_top_level']);

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('employees', 'public');
            abort_if($photoPath === false, 500, 'Le stockage de la photo a échoué.');
            $attributes['photo_path'] = $photoPath;
        }

        $employee = Employee::query()->create($attributes);

        $this->audit->record('CREATE_EMPLOYEE', $employee, null, $employee->only([
            'employee_number', 'first_name', 'last_name', 'status', 'department_id',
        ]), $request);

        return (new EmployeeResource($employee->load([
            'direction', 'department', 'manager',
        ])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Employee $employee): EmployeeResource
    {
        $this->authorize('view', $employee);

        return new EmployeeResource($employee->load(['direction', 'department', 'manager', 'badges']));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): EmployeeResource
    {
        $oldValues = $employee->only([
            'direction_id', 'department_id', 'position_title', 'manager_id', 'status',
        ]);

        $attributes = $request->safe()->except(['photo', 'is_top_level']);

        $previousPhotoPath = $employee->photo_path;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('employees', 'public');
            abort_if($photoPath === false, 500, 'Le stockage de la photo a échoué.');
            $attributes['photo_path'] = $photoPath;
        }

        $employee->fill($attributes)->save();

        if ($request->hasFile('photo') && $previousPhotoPath !== null) {
            Storage::disk('public')->delete($previousPhotoPath);
        }

        $this->audit->recordChanges('UPDATE_EMPLOYEE', $employee, $oldValues, $employee->only(array_keys($oldValues)), $request);

        return new EmployeeResource($employee->load(['direction', 'department', 'manager']));
    }

    public function destroy(Request $request, Employee $employee): JsonResponse
    {
        $this->authorize('delete', $employee);

        $employee->forceFill(['status' => 'inactive'])->save();

        $this->audit->record('DEACTIVATE_EMPLOYEE', $employee, ['status' => 'active'], ['status' => 'inactive'], $request);

        return response()->json(null, 204);
    }
}
