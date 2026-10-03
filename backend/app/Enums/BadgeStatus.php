<?php

namespace App\Enums;

enum BadgeStatus: string
{
    case Active = 'active';
    case Revoked = 'revoked';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Actif',
            self::Revoked => 'Révoqué',
            self::Lost => 'Perdu',
        };
    }
}
