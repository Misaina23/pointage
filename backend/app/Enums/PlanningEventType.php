<?php

namespace App\Enums;

enum PlanningEventType: string
{
    case Meeting = 'meeting';
    case Training = 'training';
    case Mission = 'mission';
    case RemoteWork = 'remote_work';
    case Event = 'event';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Meeting => 'Réunion',
            self::Training => 'Formation',
            self::Mission => 'Mission',
            self::RemoteWork => 'Télétravail',
            self::Event => 'Événement',
            self::Other => 'Autre',
        };
    }
}
