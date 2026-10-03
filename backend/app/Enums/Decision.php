<?php

namespace App\Enums;

enum Decision: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Skipped = 'skipped';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'Approuvé',
            self::Rejected => 'Refusé',
            self::Skipped => 'Ignoré',
        };
    }
}
