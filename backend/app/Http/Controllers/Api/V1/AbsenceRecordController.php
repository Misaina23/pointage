<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAbsenceRecordRequest;
use App\Http\Resources\AbsenceRecordResource;
use App\Models\AbsenceRecord;
use App\Services\AbsenceService;
use App\Services\EmployeeAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AbsenceRecordController extends Controller
{
    public function __construct(
        private readonly AbsenceService $absences,
        private readonly EmployeeAccessService $employees,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AbsenceRecord::class);

        $records = $this->employees->limitRelatedToVisibleEmployees(
            AbsenceRecord::query()
                ->with(['absenceType', 'employee', 'approvalRequest.workflow']),
            $request->user(),
        )
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('employee_id'), fn ($query) => $query->where('employee_id', $request->integer('employee_id')))
            ->orderByDesc('created_at')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return AbsenceRecordResource::collection($records);
    }

    public function store(StoreAbsenceRecordRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return response()->json(['message' => 'Aucun dossier employé associé à ce compte.'], 404);
        }

        $data = $request->safe()->except('attachment');
        $attachment = $request->file('attachment');

        if ($attachment instanceof UploadedFile) {
            $data['attachment_path'] = $attachment->store('attachments/absence', 'local');
        }

        $record = $this->absences->create($employee, $data);

        return (new AbsenceRecordResource($record->load(['absenceType', 'approvalRequest.workflow'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, AbsenceRecord $absenceRecord): AbsenceRecordResource
    {
        $this->authorize('view', $absenceRecord);

        return new AbsenceRecordResource($absenceRecord->load([
            'absenceType', 'employee', 'approvalRequest.workflow',
        ]));
    }

    public function destroy(Request $request, AbsenceRecord $absenceRecord): JsonResponse
    {
        $this->authorize('delete', $absenceRecord);

        $path = $absenceRecord->attachment_path;
        $absenceRecord->delete();

        if ($path !== null) {
            Storage::disk('local')->delete($path);
        }

        return response()->json(null, 204);
    }
}
