<?php

namespace App\Enums;

enum WorkflowStepType: string
{
    case Role = 'role';
    case Employee = 'employee';

    public function label(): string
    {
        return match ($this) {
            self::Role => 'Rôle',
            self::Employee => 'Employé',
        };
    }
}
