<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreLeaveRequestRequest;
use App\Http\Resources\LeaveRequestResource;
use App\Models\LeaveRequest;
use App\Services\EmployeeAccessService;
use App\Services\LeaveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly LeaveService $leaves,
        private readonly EmployeeAccessService $employees,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LeaveRequest::class);

        $requests = $this->employees->limitRelatedToVisibleEmployees(
            LeaveRequest::query()
                ->with(['leaveType', 'employee', 'approvalRequest.workflow', 'approvalRequest.actions.actor']),
            $request->user(),
        )
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->orderByDesc('created_at')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return LeaveRequestResource::collection($requests);
    }

    public function store(StoreLeaveRequestRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $data = $request->safe()->except('attachment');
        $attachment = $request->file('attachment');

        if ($attachment instanceof UploadedFile) {
            $data['attachment_path'] = $attachment->store('attachments/leave', 'local');
        }

        $leaveRequest = $this->leaves->create($employee, $data);

        return (new LeaveRequestResource($leaveRequest->load(['leaveType', 'approvalRequest.workflow'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, LeaveRequest $leaveRequest): LeaveRequestResource
    {
        $this->authorize('view', $leaveRequest);

        return new LeaveRequestResource($leaveRequest->load([
            'leaveType', 'employee', 'approvalRequest.workflow', 'approvalRequest.actions.actor',
        ]));
    }

    public function destroy(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $this->authorize('delete', $leaveRequest);

        $path = $leaveRequest->attachment_path;

        $leaveRequest->delete();

        if ($path !== null) {
            Storage::disk('local')->delete($path);
        }

        return response()->json(null, 204);
    }
}
