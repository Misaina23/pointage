<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Employee;
use App\Models\User;
use App\Notifications\PointaNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Notifie un ensemble d'utilisateurs pour un sujet donné.
     *
     * @param  Collection<int, User>  $users
     * @param  array<string, mixed>  $data
     */
    public function notifyUsers(Collection $users, NotificationType $type, string $title, array $data = []): void
    {
        foreach ($users->unique('id') as $user) {
            $user->notify(new PointaNotification($type, $title, $data));
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyEmployee(Employee $employee, NotificationType $type, string $title, array $data = []): void
    {
        $user = $employee->user;

        if ($user === null) {
            return;
        }

        $this->notifyUsers(collect([$user]), $type, $title, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyAboutRequest(Model $requestable, NotificationType $type, string $title, array $data = []): void
    {
        $this->notifyEmployee($requestable->employee, $type, $title, [
            'request_id' => $requestable->getKey(),
            ...$data,
        ]);
    }
}
