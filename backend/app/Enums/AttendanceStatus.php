<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case Present = 'present';
    case Late = 'late';
    case Absent = 'absent';
    case OnLeave = 'on_leave';
    case OnPermission = 'on_permission';
    case Remote = 'remote';
    case Holiday = 'holiday';
    case RestDay = 'rest_day';
    case Incomplete = 'incomplete';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Présent',
            self::Late => 'Retard',
            self::Absent => 'Absent',
            self::OnLeave => 'En congé',
            self::OnPermission => 'En permission',
            self::Remote => 'Télétravail',
            self::Holiday => 'Jour férié',
            self::RestDay => 'Jour de repos',
            self::Incomplete => 'Pointage incomplet',
        };
    }
}
