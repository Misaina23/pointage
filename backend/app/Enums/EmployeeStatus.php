<?php

namespace App\Enums;

enum EmployeeStatus: string
{
    case Active = 'active';
    case OnLeave = 'on_leave';
    case Suspended = 'suspended';
    case Inactive = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Actif',
            self::OnLeave => 'En congé',
            self::Suspended => 'Suspendu',
            self::Inactive => 'Inactif',
        };
    }
}
