<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\DirectionResource;
use App\Models\Department;
use App\Models\Direction;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrganizationController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function directions(Request $request): AnonymousResourceCollection
    {
        $this->authorizeOrganization($request);

        return DirectionResource::collection(
            Direction::query()
                ->withCount('departments')
                ->withEmployeeCount()
                ->when($request->filled('search'), fn ($query) => $query
                    ->where('name', 'ilike', '%'.$request->string('search')->trim().'%'))
                ->orderBy('name')
                ->get()
        );
    }

    public function storeDirection(Request $request): JsonResponse
    {
        $this->authorizeOrganization($request, true);

        $direction = Direction::query()->create($this->validated($request, [
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', 'unique:directions,code'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]));

        $this->audit->record('CREATE_DIRECTION', $direction, null, $direction->only(['name', 'code']), $request);

        return (new DirectionResource($direction))->response()->setStatusCode(201);
    }

    public function updateDirection(Request $request, Direction $direction): DirectionResource
    {
        $this->authorizeOrganization($request, true);

        $direction->fill($this->validated($request, [
            'name' => ['sometimes', 'string', 'max:150'],
            'code' => ['sometimes', 'string', 'max:50', 'unique:directions,code,'.$direction->id],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
        ]))->save();

        return new DirectionResource(
            Direction::query()
                ->withCount('departments')
                ->withEmployeeCount()
                ->findOrFail($direction->id)
        );
    }

    public function departments(Request $request): AnonymousResourceCollection
    {
        $this->authorizeOrganization($request);

        return DepartmentResource::collection(
            Department::query()
                ->with('direction')
                ->withCount('employees')
                ->when($request->filled('direction_id'), fn ($query) => $query->where('direction_id', $request->integer('direction_id')))
                ->orderBy('name')
                ->get()
        );
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $this->authorizeOrganization($request, true);

        $department = Department::query()->create($this->validated($request, [
            'direction_id' => ['required', 'integer', 'exists:directions,id'],
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', 'unique:departments,code'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]));

        $this->audit->record('CREATE_DEPARTMENT', $department, null, $department->only(['name', 'code', 'direction_id']), $request);

        return (new DepartmentResource($department->load('direction')))->response()->setStatusCode(201);
    }

    /**
     * @param  array<string, array<int, string>>  $rules
     * @return array<string, mixed>
     */
    private function validated(Request $request, array $rules): array
    {
        return $request->validate($rules);
    }

    private function authorizeOrganization(Request $request, bool $write = false): void
    {
        abort_unless(
            $request->user()->hasPermission($write ? 'organization.manage' : 'employees.view'),
            403,
        );
    }
}
