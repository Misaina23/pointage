<?php

namespace App\Policies;

use App\Models\PlanningEvent;
use App\Models\User;

class PlanningEventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('planning.view');
    }

    public function view(User $user, PlanningEvent $event): bool
    {
        if ($user->hasPermission('planning.view')) {
            return true;
        }

        return $event->participants()->whereKey($user->employee?->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('planning.manage');
    }

    public function update(User $user, PlanningEvent $event): bool
    {
        return $user->hasPermission('planning.manage');
    }

    public function delete(User $user, PlanningEvent $event): bool
    {
        return $user->hasPermission('planning.manage');
    }
}
