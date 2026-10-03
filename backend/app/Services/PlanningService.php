<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Employee;
use App\Models\PlanningEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PlanningService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /**
     * @param  array<int, int>  $participantIds
     * @return array<string, mixed>
     */
    public function create(User $creator, array $data, array $participantIds): PlanningEvent
    {
        return DB::transaction(function () use ($creator, $data, $participantIds): PlanningEvent {
            $event = PlanningEvent::query()->create([
                'created_by' => $creator->id,
                'direction_id' => $data['direction_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'event_type' => $data['event_type'],
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'] ?? null,
                'location' => $data['location'] ?? null,
            ]);

            $event->participants()->sync(array_fill_keys($participantIds, ['attendance_status' => 'invited']));

            $this->notifyParticipants($event, NotificationType::MeetingInvitation, 'Nouvelle réunion planifiée');

            return $event->load('participants');
        });
    }

    /**
     * @param  array<int, int>  $participantIds
     * @return array<string, mixed>
     */
    public function update(PlanningEvent $event, array $data, ?array $participantIds = null): PlanningEvent
    {
        return DB::transaction(function () use ($event, $data, $participantIds): PlanningEvent {
            $event->fill($data)->save();

            if ($participantIds !== null) {
                $event->participants()->sync(array_fill_keys($participantIds, ['attendance_status' => 'invited']));
            }

            $this->notifyParticipants($event, NotificationType::PlanningUpdated, 'Planning mis à jour');

            return $event->load('participants');
        });
    }

    public function delete(PlanningEvent $event): void
    {
        $event->participants()->detach();
        $event->delete();
    }

    private function notifyParticipants(PlanningEvent $event, NotificationType $type, string $title): void
    {
        $users = User::query()
            ->whereHas('employee', fn ($query) => $query
                ->whereIn('employees.id', $event->participants()->pluck('employees.id')))
            ->get();

        $this->notifications->notifyUsers($users, $type, $title, [
            'planning_event_id' => $event->id,
            'starts_at' => $event->starts_at?->toIso8601String(),
            'location' => $event->location,
        ]);
    }

    /**
     * @return array<int, Employee>
     */
    public function participantsFor(PlanningEvent $event): array
    {
        return $event->participants()->get()->all();
    }
}
