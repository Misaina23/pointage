<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StorePermissionRequestRequest;
use App\Http\Resources\PermissionRequestResource;
use App\Models\PermissionRequest;
use App\Services\EmployeeAccessService;
use App\Services\PermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PermissionRequestController extends Controller
{
    public function __construct(
        private readonly PermissionService $permissions,
        private readonly EmployeeAccessService $employees,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PermissionRequest::class);

        $requests = $this->employees->limitRelatedToVisibleEmployees(
            PermissionRequest::query()
                ->with(['permissionType', 'employee', 'approvalRequest.workflow']),
            $request->user(),
        )
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->orderByDesc('created_at')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return PermissionRequestResource::collection($requests);
    }

    public function store(StorePermissionRequestRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $data = $request->safe()->except('attachment');
        $attachment = $request->file('attachment');

        if ($attachment instanceof UploadedFile) {
            $data['attachment_path'] = $attachment->store('attachments/permission', 'local');
        }

        $permissionRequest = $this->permissions->create($employee, $data);

        return (new PermissionRequestResource($permissionRequest->load(['permissionType', 'approvalRequest.workflow'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, PermissionRequest $permissionRequest): PermissionRequestResource
    {
        $this->authorize('view', $permissionRequest);

        return new PermissionRequestResource($permissionRequest->load([
            'permissionType', 'employee', 'approvalRequest.workflow',
        ]));
    }

    public function destroy(Request $request, PermissionRequest $permissionRequest): JsonResponse
    {
        $this->authorize('delete', $permissionRequest);

        $path = $permissionRequest->attachment_path;
        $permissionRequest->delete();

        if ($path !== null) {
            Storage::disk('local')->delete($path);
        }

        return response()->json(null, 204);
    }
}
