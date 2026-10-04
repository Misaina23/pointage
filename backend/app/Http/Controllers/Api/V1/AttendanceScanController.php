<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BadgeStatus;
use App\Enums\EmployeeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ScanAttendanceRequest;
use App\Http\Resources\AttendanceEventResource;
use App\Models\AttendanceEvent;
use App\Models\Badge;
use App\Models\Device;
use App\Models\Employee;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendanceScanController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function store(ScanAttendanceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $badgeIdentifier = $data['badge_public_id'];
        $occurredAt = CarbonImmutable::parse($data['occurred_at'])
            ->setTimezone(config('app.timezone'));
        $deviceCode = $data['device_code'] ?? null;

        $existingEvent = AttendanceEvent::query()
            ->with(['badge', 'device', 'employee'])
            ->where('client_event_id', $data['client_event_id'])
            ->first();

        if ($existingEvent) {
            return $this->respondForExistingEvent(
                $existingEvent,
                $badgeIdentifier,
                $data['event_type'],
                $occurredAt,
                $deviceCode,
            );
        }

        $badgeColumn = Str::isUuid($badgeIdentifier) ? 'public_id' : 'badge_number';
        $badge = Badge::query()
            ->where($badgeColumn, $badgeIdentifier)
            ->first();

        if (! $badge) {
            return response()->json(['message' => 'Badge inconnu, inactif ou révoqué.'], 404);
        }

        $event = DB::transaction(function () use ($badge, $badgeColumn, $badgeIdentifier, $data, $deviceCode, $occurredAt): AttendanceEvent|JsonResponse {
            $lockedBadge = Badge::query()->whereKey($badge->id)->lockForUpdate()->first();

            if (
                ! $lockedBadge
                || $lockedBadge->getAttribute($badgeColumn) !== $badgeIdentifier
                || $lockedBadge->status !== BadgeStatus::Active
                || $lockedBadge->revoked_at !== null
                || $lockedBadge->issued_at?->isFuture()
            ) {
                return response()->json(['message' => 'Badge inconnu, inactif ou révoqué.'], 404);
            }

            $employee = Employee::query()
                ->whereKey($lockedBadge->employee_id)
                ->lockForUpdate()
                ->first();

            if (! $employee || $employee->status !== EmployeeStatus::Active) {
                return response()->json(['message' => 'Badge inconnu, inactif ou révoqué.'], 404);
            }

            $existingEvent = AttendanceEvent::query()
                ->with(['badge', 'device', 'employee'])
                ->where('client_event_id', $data['client_event_id'])
                ->lockForUpdate()
                ->first();

            if ($existingEvent) {
                return $this->respondForExistingEvent(
                    $existingEvent,
                    $badgeIdentifier,
                    $data['event_type'],
                    $occurredAt,
                    $deviceCode,
                );
            }

            $device = null;
            if ($deviceCode !== null) {
                $device = Device::query()
                    ->where('device_code', $deviceCode)
                    ->lockForUpdate()
                    ->first();

                if (! $device || $device->status !== 'active') {
                    return response()->json(['message' => 'Terminal inconnu ou inactif.'], 404);
                }
            }

            $previousEvent = AttendanceEvent::query()
                ->where('employee_id', $employee->id)
                ->where('occurred_at', '<=', $occurredAt)
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->first();
            $nextEvent = AttendanceEvent::query()
                ->where('employee_id', $employee->id)
                ->where('occurred_at', '>', $occurredAt)
                ->orderBy('occurred_at')
                ->orderBy('id')
                ->first();

            if (
                ($data['event_type'] === 'exit' && $previousEvent === null)
                || $previousEvent?->event_type === $data['event_type']
                || $nextEvent?->event_type === $data['event_type']
            ) {
                return response()->json([
                    'message' => $data['event_type'] === 'exit'
                        ? 'Impossible d\'enregistrer une sortie sans entrée préalable.'
                        : 'Une entrée est déjà ouverte. Enregistrez d\'abord la sortie précédente.',
                ], 422);
            }

            $event = AttendanceEvent::query()->create([
                'employee_id' => $employee->id,
                'badge_id' => $lockedBadge->id,
                'device_id' => $device?->id,
                'client_event_id' => $data['client_event_id'],
                'event_type' => $data['event_type'],
                'occurred_at' => $occurredAt,
                'source' => 'security_scan',
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
            ]);

            if ($device) {
                $device->forceFill(['last_seen_at' => now()])->save();
            }

            $this->attendance->recompute($employee, $occurredAt);

            return $event;
        });

        if ($event instanceof JsonResponse) {
            return $event;
        }

        $event->load(['badge', 'device', 'employee']);

        return $this->eventResponse($event, false, 201);
    }

    private function respondForExistingEvent(
        AttendanceEvent $event,
        string $badgeIdentifier,
        string $eventType,
        CarbonImmutable $occurredAt,
        ?string $deviceCode,
    ): JsonResponse {
        if (
            ! in_array($badgeIdentifier, [$event->badge?->public_id, $event->badge?->badge_number], true)
            || $event->event_type !== $eventType
            || ! $event->occurred_at?->equalTo($occurredAt)
            || $event->device?->device_code !== $deviceCode
        ) {
            return response()->json(['message' => 'Cette clé de scan a déjà été utilisée pour un autre événement.'], 409);
        }

        return $this->eventResponse($event, true, 200);
    }

    private function eventResponse(AttendanceEvent $event, bool $duplicate, int $status): JsonResponse
    {
        return (new AttendanceEventResource($event))
            ->additional(['duplicate' => $duplicate])
            ->response()
            ->setStatusCode($status);
    }
}
