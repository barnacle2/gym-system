<?php

namespace App\Http\Controllers;

use App\Models\BalanceLog;
use App\Models\TimeSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            abort(403);
        }

        $tab = $request->get('tab', 'sales-daily');

        return match ($tab) {
            'sales-daily' => $this->salesDaily(),
            'sales-monthly' => $this->salesMonthly(),
            'sales-annual' => $this->salesAnnual(),
            'time-daily' => $this->timeDaily(),
            'time-monthly' => $this->timeMonthly(),
            'time-annual' => $this->timeAnnual(),
            default => $this->salesDaily(),
        };
    }

    private function salesDaily()
    {
        $today = now()->toDateString();
        $logs = BalanceLog::whereDate('created_at', $today)
            ->orderBy('created_at')
            ->get();

        $transactions = $logs->map(fn ($log) => [
            'time' => $log->created_at->format('H:i'),
            'type' => $log->type,
            'description' => $log->description,
            'amount' => (float) $log->amount,
            'balance_after' => (float) $log->balance_after,
        ]);

        $totalRevenue = $logs->sum('amount');
        $transactionCount = $logs->count();

        // Daily member earnings (from time sessions)
        $dailyEarnings = TimeSession::whereDate('time_in', $today)
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        return Inertia::render('admin/reports', [
            'activeTab' => 'sales-daily',
            'salesDaily' => [
                'date' => $today,
                'totalRevenue' => (float) $totalRevenue,
                'dailyEarnings' => (float) $dailyEarnings,
                'transactionCount' => $transactionCount,
                'transactions' => $transactions,
            ],
        ]);
    }

    private function salesMonthly()
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $logs = BalanceLog::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->orderBy('created_at')
            ->get();

        // Group by day
        $dailyTotals = $logs->groupBy(fn ($log) => $log->created_at->format('Y-m-d'))
            ->map(fn ($dayLogs) => [
                'date' => $dayLogs->first()->created_at->format('M j'),
                'total' => (float) $dayLogs->sum('amount'),
                'count' => $dayLogs->count(),
            ])
            ->values();

        $monthlyRevenue = $logs->sum('amount');
        $transactionCount = $logs->count();

        // Monthly earnings from time sessions
        $monthlyEarnings = TimeSession::whereBetween('time_in', [$startOfMonth, $endOfMonth])
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        return Inertia::render('admin/reports', [
            'activeTab' => 'sales-monthly',
            'salesMonthly' => [
                'month' => now()->format('F Y'),
                'totalRevenue' => (float) $monthlyRevenue,
                'monthlyEarnings' => (float) $monthlyEarnings,
                'transactionCount' => $transactionCount,
                'dailyTotals' => $dailyTotals,
            ],
        ]);
    }

    private function salesAnnual()
    {
        $startOfYear = now()->startOfYear();
        $endOfYear = now()->endOfYear();

        $logs = BalanceLog::whereBetween('created_at', [$startOfYear, $endOfYear])
            ->orderBy('created_at')
            ->get();

        // Group by month
        $monthlyTotals = $logs->groupBy(fn ($log) => $log->created_at->format('Y-m'))
            ->map(fn ($monthLogs) => [
                'month' => $monthLogs->first()->created_at->format('M'),
                'total' => (float) $monthLogs->sum('amount'),
                'count' => $monthLogs->count(),
            ])
            ->values();

        $yearlyRevenue = $logs->sum('amount');
        $transactionCount = $logs->count();

        // Annual earnings from time sessions
        $annualEarnings = TimeSession::whereBetween('time_in', [$startOfYear, $endOfYear])
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        return Inertia::render('admin/reports', [
            'activeTab' => 'sales-annual',
            'salesAnnual' => [
                'year' => now()->format('Y'),
                'totalRevenue' => (float) $yearlyRevenue,
                'annualEarnings' => (float) $annualEarnings,
                'transactionCount' => $transactionCount,
                'monthlyTotals' => $monthlyTotals,
            ],
        ]);
    }

    private function timeDaily()
    {
        $today = now()->toDateString();
        $sessions = TimeSession::whereDate('time_in', $today)
            ->with('user')
            ->orderBy('time_in')
            ->get();

        $timeLogs = $sessions->map(fn ($session) => [
            'id' => $session->id,
            'member' => $session->user->name,
            'time_in' => $session->time_in?->format('H:i'),
            'time_out' => $session->time_out?->format('H:i'),
            'duration' => $session->getFormattedDuration(),
            'credits_used' => $session->credits_used,
            'is_active' => $session->is_active,
        ]);

        $totalSessions = $sessions->count();
        $activeSessions = $sessions->where('is_active', true)->count();
        $totalHours = $sessions->sum(fn ($s) => $s->getDurationInMinutes() / 60);

        return Inertia::render('admin/reports', [
            'activeTab' => 'time-daily',
            'timeDaily' => [
                'date' => $today,
                'totalSessions' => $totalSessions,
                'activeSessions' => $activeSessions,
                'totalHours' => round($totalHours, 2),
                'timeLogs' => $timeLogs,
            ],
        ]);
    }

    private function timeMonthly()
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $sessions = TimeSession::whereBetween('time_in', [$startOfMonth, $endOfMonth])
            ->with('user')
            ->orderBy('time_in')
            ->get();

        // Group by day
        $dailySessions = $sessions->groupBy(fn ($session) => $session->time_in->format('Y-m-d'))
            ->map(fn ($daySessions) => [
                'date' => $daySessions->first()->time_in->format('M j'),
                'sessions' => $daySessions->count(),
                'hours' => round($daySessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
            ])
            ->values();

        $totalSessions = $sessions->count();
        $totalHours = $sessions->sum(fn ($s) => $s->getDurationInMinutes() / 60);
        $uniqueMembers = $sessions->pluck('user_id')->unique()->count();

        return Inertia::render('admin/reports', [
            'activeTab' => 'time-monthly',
            'timeMonthly' => [
                'month' => now()->format('F Y'),
                'totalSessions' => $totalSessions,
                'totalHours' => round($totalHours, 2),
                'uniqueMembers' => $uniqueMembers,
                'dailySessions' => $dailySessions,
            ],
        ]);
    }

    private function timeAnnual()
    {
        $startOfYear = now()->startOfYear();
        $endOfYear = now()->endOfYear();

        $sessions = TimeSession::whereBetween('time_in', [$startOfYear, $endOfYear])
            ->with('user')
            ->orderBy('time_in')
            ->get();

        // Group by month
        $monthlySessions = $sessions->groupBy(fn ($session) => $session->time_in->format('Y-m'))
            ->map(fn ($monthSessions) => [
                'month' => $monthSessions->first()->time_in->format('M'),
                'sessions' => $monthSessions->count(),
                'hours' => round($monthSessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
                'members' => $monthSessions->pluck('user_id')->unique()->count(),
            ])
            ->values();

        $totalSessions = $sessions->count();
        $totalHours = $sessions->sum(fn ($s) => $s->getDurationInMinutes() / 60);
        $uniqueMembers = $sessions->pluck('user_id')->unique()->count();

        // Top members by sessions
        $topMembers = $sessions->groupBy('user_id')
            ->map(fn ($userSessions) => [
                'name' => $userSessions->first()->user->name,
                'sessions' => $userSessions->count(),
                'hours' => round($userSessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
            ])
            ->sortByDesc('sessions')
            ->take(10)
            ->values();

        return Inertia::render('admin/reports', [
            'activeTab' => 'time-annual',
            'timeAnnual' => [
                'year' => now()->format('Y'),
                'totalSessions' => $totalSessions,
                'totalHours' => round($totalHours, 2),
                'uniqueMembers' => $uniqueMembers,
                'monthlySessions' => $monthlySessions,
                'topMembers' => $topMembers,
            ],
        ]);
    }
}
