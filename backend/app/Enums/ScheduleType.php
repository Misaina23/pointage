<?php

namespace App\Enums;

enum ScheduleType: string
{
    case Fixed = 'fixed';
    case Variable = 'variable';
    case MorningShift = 'morning_shift';
    case AfternoonShift = 'afternoon_shift';
    case NightShift = 'night_shift';
    case Weekend = 'weekend';

    public function label(): string
    {
        return match ($this) {
            self::Fixed => 'Horaire fixe',
            self::Variable => 'Horaire variable',
            self::MorningShift => 'Équipe matin',
            self::AfternoonShift => 'Équipe soir',
            self::NightShift => 'Équipe nuit',
            self::Weekend => 'Équipe week-end',
        };
    }
}
