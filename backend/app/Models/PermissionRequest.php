<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class PermissionRequest extends Model
{
    protected $fillable = [
        'employee_id', 'permission_type_id', 'permission_date', 'starts_at', 'ends_at',
        'requested_days', 'reason', 'attachment_path', 'status', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'permission_date' => 'immutable_date',
            'requested_days' => 'decimal:2',
            'submitted_at' => 'immutable_datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function permissionType(): BelongsTo
    {
        return $this->belongsTo(PermissionType::class);
    }

    public function approvalRequest(): MorphOne
    {
        return $this->morphOne(ApprovalRequest::class, 'requestable');
    }
}
