<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PlanningEventType;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlanningEventResource;
use App\Models\PlanningEvent;
use App\Services\PlanningService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlanningEventController extends Controller
{
    public function __construct(private readonly PlanningService $planning) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PlanningEvent::class);

        $from = CarbonImmutable::parse($request->input('from', CarbonImmutable::now()->startOfMonth()));
        $to = CarbonImmutable::parse($request->input('to', CarbonImmutable::now()->endOfMonth()));

        $events = PlanningEvent::query()
            ->with(['creator', 'participants'])
            ->whereBetween('starts_at', [$from, $to])
            ->when($request->filled('event_type'), fn ($query) => $query->where('event_type', $request->string('event_type')))
            ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
            ->when(
                ! $request->user()->hasPermission('planning.manage'),
                fn ($query) => $query->whereHas('participants', fn ($scope) => $scope->whereKey($request->user()->employee?->id))
            )
            ->orderBy('starts_at')
            ->get();

        return response()->json([
            'data' => PlanningEventResource::collection($events)->resolve($request),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', PlanningEvent::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'event_type' => ['required', Rule::in(array_column(PlanningEventType::cases(), 'value'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'location' => ['nullable', 'string', 'max:200'],
            'direction_id' => ['nullable', 'integer', 'exists:directions,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:employees,id'],
        ]);

        $event = $this->planning->create(
            $request->user(),
            $validated,
            $validated['participant_ids'],
        );

        return (new PlanningEventResource($event->load(['creator', 'participants'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, PlanningEvent $planningEvent): PlanningEventResource
    {
        $this->authorize('view', $planningEvent);

        return new PlanningEventResource($planningEvent->load(['creator', 'participants']));
    }

    public function update(Request $request, PlanningEvent $planningEvent): PlanningEventResource
    {
        $this->authorize('update', $planningEvent);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'event_type' => ['sometimes', Rule::in(array_column(PlanningEventType::cases(), 'value'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:200'],
            'participant_ids' => ['sometimes', 'array'],
            'participant_ids.*' => ['integer', 'exists:employees,id'],
        ]);

        $participantIds = $validated['participant_ids'] ?? null;
        unset($validated['participant_ids']);

        $event = $this->planning->update($planningEvent, $validated, $participantIds);

        return new PlanningEventResource($event->load(['creator', 'participants']));
    }

    public function destroy(Request $request, PlanningEvent $planningEvent): JsonResponse
    {
        $this->authorize('delete', $planningEvent);

        $this->planning->delete($planningEvent);

        return response()->json(null, 204);
    }
}
