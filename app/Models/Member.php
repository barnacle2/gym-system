<?php

namespace App\Models;

use App\Enums\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Member extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'email',
        'phone',
        'plan',
        'start_date',
        'end_date',
        'notes',
        'workout_plan',
        'workout_plans',
        'active_workout_plan',
        'inactive',
        'renewals',
    ];

    protected $casts = [
        'plan' => MembershipPlan::class,
        'start_date' => 'date',
        'end_date' => 'date',
        'inactive' => 'boolean',
        'renewals' => 'integer',
        'workout_plans' => 'array',
    ];

    /**
     * Get the user that owns the membership
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the member's status based on end date and inactive flag
     */
    public function getStatusAttribute(): array
    {
        if ($this->inactive) {
            return [
                'code' => 'INACTIVE',
                'label' => 'Inactive',
                'className' => 'inactive',
                'daysLeft' => null
            ];
        }

        $now = Carbon::now();
        $endDate = Carbon::parse($this->end_date);
        $diffDays = $now->diffInDays($endDate, false);

        if ($diffDays < 0) {
            return [
                'code' => 'EXPIRED',
                'label' => 'Expired',
                'className' => 'expired',
                'daysLeft' => $diffDays
            ];
        }

        if ($diffDays <= 7) {
            return [
                'code' => 'EXPIRING',
                'label' => "Expiring ({$diffDays}d)",
                'className' => 'expiring',
                'daysLeft' => $diffDays
            ];
        }

        return [
            'code' => 'ACTIVE',
            'label' => 'Active',
            'className' => 'active',
            'daysLeft' => $diffDays
        ];
    }

    /**
     * Scope to get active members
     */
    public function scopeActive($query)
    {
        return $query->where('inactive', false)
                    ->where('end_date', '>=', Carbon::now());
    }

    /**
     * Scope to get expiring members (within specified days)
     */
    public function scopeExpiring($query, $days = 7)
    {
        return $query->where('inactive', false)
                    ->whereBetween('end_date', [
                        Carbon::now(),
                        Carbon::now()->addDays($days)
                    ]);
    }

    /**
     * Scope to get expired members
     */
    public function scopeExpired($query)
    {
        return $query->where('inactive', false)
                    ->where('end_date', '<', Carbon::now());
    }

    /**
     * Scope to get inactive members
     */
    public function scopeInactive($query)
    {
        return $query->where('inactive', true);
    }

    /**
     * Renew membership based on current plan
     */
    public function renew(): void
    {
        $startDate = Carbon::now();

        if ($this->plan === MembershipPlan::DAILY) {
            // Daily plan: treat renewal as a new day window
            $this->update([
                'start_date' => $startDate,
                'end_date' => $startDate,
                'inactive' => false,
                'renewals' => $this->renewals + 1,
            ]);
            return;
        }

        $months = $this->plan->months();

        $this->update([
            'start_date' => $startDate,
            'end_date' => $startDate->copy()->addMonths($months),
            'inactive' => false,
            'renewals' => $this->renewals + 1,
        ]);
    }    /**
     * Toggle member's active/inactive status
     */
    public function toggleStatus(): void
    {
        $this->update([
            'inactive' => !$this->inactive
        ]);
    }
}
