<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class TimeSession extends Model
{
    protected $fillable = [
        'user_id',
        'time_in',
        'time_out',
        'credits_used',
        'hourly_rate',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'time_in' => 'datetime',
            'time_out' => 'datetime',
            'credits_used' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the time session
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate current credits used based on time elapsed
     */
    public function getCurrentCreditsUsed(): float
    {
        $endTime = $this->time_out ?? now();
        $hours = $this->time_in->diffInHours($endTime, true);
        return round($hours * $this->hourly_rate, 2);
    }

    /**
     * Calculate live balance deduction
     */
    public function getLiveBalanceDeduction(): float
    {
        if (!$this->is_active) {
            return $this->credits_used;
        }

        return $this->getCurrentCreditsUsed();
    }

    /**
     * Get the session duration in minutes
     */
    public function getDurationInMinutes(): int
    {
        $endTime = $this->time_out ?? now();
        return $this->time_in->diffInMinutes($endTime);
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDuration(): string
    {
        $minutes = $this->getDurationInMinutes();
        $hours = intval($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return "{$hours}h {$mins}m";
        }

        return "{$mins}m";
    }

    /**
     * Close the session and calculate final credits
     */
    public function closeSession(): void
    {
        $this->update([
            'time_out' => now(),
            'credits_used' => $this->getCurrentCreditsUsed(),
            'is_active' => false,
        ]);
    }

    /**
     * Scope for active sessions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for sessions by date
     */
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('time_in', $date);
    }
}
