<?php

namespace App\Data;

use Carbon\CarbonImmutable;

final readonly class ScheduledShift
{
    public function __construct(
        public CarbonImmutable $date,
        public ?CarbonImmutable $startsAt,
        public ?CarbonImmutable $endsAt,
        public ?CarbonImmutable $breakStartsAt,
        public ?CarbonImmutable $breakEndsAt,
        public int $lateToleranceMinutes,
        public bool $isRestDay,
    ) {}

    public function hasHours(): bool
    {
        return $this->startsAt !== null && $this->endsAt !== null;
    }

    public function isNightShift(): bool
    {
        return $this->hasHours() && $this->endsAt->lessThan($this->startsAt);
    }

    /**
     * Fenêtre de présence attendue, ramenée sur la date de référence pour les équipes de nuit.
     */
    public function expectedEntryAt(): ?CarbonImmutable
    {
        return $this->startsAt?->setDate($this->date->year, $this->date->month, $this->date->day);
    }

    public function expectedExitAt(): ?CarbonImmutable
    {
        if (! $this->hasHours()) {
            return null;
        }

        $exit = $this->endsAt->setDate($this->date->year, $this->date->month, $this->date->day);

        return $this->isNightShift() ? $exit->addDay() : $exit;
    }

    /**
     * Minutes de travail attendues, pause déduite.
     */
    public function expectedMinutes(): int
    {
        if (! $this->hasHours()) {
            return 0;
        }

        $minutes = (int) $this->expectedEntryAt()->diffInMinutes($this->expectedExitAt(), false);

        return max(0, $minutes - $this->breakMinutes());
    }

    public function breakMinutes(): int
    {
        if ($this->breakStartsAt === null || $this->breakEndsAt === null) {
            return 0;
        }

        return max(0, (int) $this->breakStartsAt->diffInMinutes($this->breakEndsAt, false));
    }
}
