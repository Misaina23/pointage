<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    public function record(
        string $action,
        Model $subject,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::query()->create([
            'actor_user_id' => $request?->user()?->id,
            'action' => $action,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $changes
     */
    public function recordChanges(
        string $action,
        Model $subject,
        array $oldValues,
        array $newValues,
        ?Request $request = null,
    ): AuditLog {
        return $this->record(
            $action,
            $subject,
            array_intersect_key($oldValues, $newValues),
            array_intersect_key($newValues, $oldValues),
            $request,
        );
    }
}
