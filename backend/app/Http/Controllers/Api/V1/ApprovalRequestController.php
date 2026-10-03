<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Decision;
use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApprovalRequestResource;
use App\Models\ApprovalRequest;
use App\Services\ApprovalService;
use App\Services\RequestDecisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalRequestController extends Controller
{
    public function __construct(
        private readonly ApprovalService $approvals,
        private readonly RequestDecisionService $decisions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $approvals = $this->approvals->pendingApprovalsFor($request->user());

        return response()->json([
            'data' => ApprovalRequestResource::collection($approvals),
        ]);
    }

    public function decide(Request $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $decision = Decision::from($validated['decision']);

        $approval = $this->decisions->decide(
            $approvalRequest->load(['requestable', 'workflow']),
            $request->user(),
            $decision,
            $validated['comment'] ?? null,
        );

        return response()->json([
            'data' => (new ApprovalRequestResource($approval->load(['requestable', 'workflow', 'actions.actor'])))
                ->resolve($request),
            'message' => $approval->status === RequestStatus::Pending->value
                ? 'Demande transmise à l\'étape suivante.'
                : 'Demande '.($decision === Decision::Approved ? 'approuvée' : 'refusée').'.',
        ]);
    }
}
