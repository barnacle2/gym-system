<?php

namespace App\Models;

use App\Enums\MembershipPlan;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_admin' => 'boolean',
            'balance' => 'decimal:2',
        ];
    }

    /**
     * Get the member record associated with the user
     */
    public function member()
    {
        return $this->hasOne(Member::class);
    }

    /**
     * Balance change logs for this user
     */
    public function balanceLogs()
    {
        return $this->hasMany(BalanceLog::class);
    }

    /**
     * Get the time sessions for the user
     */
    public function timeSessions()
    {
        return $this->hasMany(TimeSession::class);
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->is_admin ?? false;
    }

    /**
     * Check if user is a member (has a member record)
     */
    public function isMember(): bool
    {
        return $this->member()->exists();
    }

    /**
     * Add amount to user's balance
     */
    public function addBalance(float $amount): void
    {
        $this->increment('balance', $amount);
    }

    /**
     * Deduct amount from user's balance
     */
    public function deductBalance(float $amount): void
    {
        $this->decrement('balance', $amount);
    }

    /**
     * Set user's balance to a specific amount
     */
    public function setBalance(float $amount): void
    {
        $this->update(['balance' => $amount]);
    }

    /**
     * Check if user has sufficient balance
     */
    public function hasSufficientBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * Get formatted balance
     */
    public function getFormattedBalance(): string
    {
        return '₱' . number_format((float) $this->balance, 2);
    }

    /**
     * Get the active time session for today
     */
    public function getActiveTimeSession()
    {
        return $this->timeSessions()
            ->active()
            ->byDate(today())
            ->first();
    }

    /**
     * Check if user has an active session today
     */
    public function hasActiveSessionToday(): bool
    {
        return $this->getActiveTimeSession() !== null;
    }

    /**
     * Start a new time session
     */
    public function timeIn(): TimeSession
    {
        // Close any existing active session first
        $activeSession = $this->getActiveTimeSession();
        if ($activeSession) {
            $activeSession->closeSession();
        }

        $hourlyRate = 0.00;
        if ($this->member && $this->member->plan === MembershipPlan::DAILY) {
            // Daily plan: pay-as-you-go rate per hour
            $hourlyRate = 10.00;
        }

        return $this->timeSessions()->create([
            'time_in' => now(),
            'hourly_rate' => $hourlyRate,
            'is_active' => true,
        ]);
    }

    /**
     * End the current time session
     */
    public function timeOut(): ?TimeSession
    {
        $activeSession = $this->getActiveTimeSession();
        if ($activeSession) {
            $activeSession->closeSession();

            // For Daily plan members, add the session cost to their balance (pay-as-you-go)
            if ($this->member && $this->member->plan === MembershipPlan::DAILY) {
                $cost = (float) $activeSession->credits_used;
                if ($cost > 0) {
                    $this->addBalance($cost);
                    // Optional: create a balance log entry if BalanceLog model is set up
                    if (class_exists(\App\Models\BalanceLog::class)) {
                        BalanceLog::create([
                            'user_id' => $this->id,
                            'amount' => $cost,
                            'balance_after' => $this->balance,
                            'type' => 'session_fee',
                            'description' => 'Daily plan gym session fee',
                        ]);
                    }
                }
            }

            return $activeSession;
        }

        return null;
    }

    /**
     * Get live balance (accounting for current session)
     */
    public function getLiveBalance(): float
    {
        // Subscription model: live balance is the stored balance (no deductions during sessions)
        return (float) $this->balance;
    }

    /**
     * Get formatted live balance
     */
    public function getFormattedLiveBalance(): string
    {
        return '₱' . number_format($this->getLiveBalance(), 2);
    }

    /**
     * Get today's time sessions
     */
    public function getTodaysTimeSessions()
    {
        return $this->timeSessions()
            ->byDate(today())
            ->orderBy('time_in', 'desc')
            ->get();
    }
}
