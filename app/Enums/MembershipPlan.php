<?php

namespace App\Enums;

enum MembershipPlan: string
{
    case DAILY = 'Daily';
    case MONTHLY = 'Monthly';
    case QUARTERLY = 'Quarterly';
    case SEMI_ANNUAL = 'Semi-Annual';
    case ANNUAL = 'Annual';

    /**
     * Get the number of months for this plan
     */
    public function months(): int
    {
        return match ($this) {
            self::DAILY => 0,
            self::MONTHLY => 1,
            self::QUARTERLY => 3,
            self::SEMI_ANNUAL => 6,
            self::ANNUAL => 12,
        };
    }

    /**
     * Get all plan values as an array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get plan options for forms/selects
     */
    public static function options(): array
    {
        return collect(self::cases())->mapWithKeys(fn($case) => [
            $case->value => $case->value
        ])->toArray();
    }
}
