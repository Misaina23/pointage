<?php

namespace App\Enums;

use App\Models\AbsenceRecord;
use App\Models\LeaveRequest;
use App\Models\PermissionRequest;
use Illuminate\Database\Eloquent\Model;

enum RequestType: string
{
    case Leave = 'leave';
    case Permission = 'permission';
    case Absence = 'absence';

    public function label(): string
    {
        return match ($this) {
            self::Leave => 'Congé',
            self::Permission => 'Permission',
            self::Absence => 'Absence',
        };
    }

    /**
     * @return class-string<Model>
     */
    public function requestableModel(): string
    {
        return match ($this) {
            self::Leave => LeaveRequest::class,
            self::Permission => PermissionRequest::class,
            self::Absence => AbsenceRecord::class,
        };
    }
}
