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

        $activeTab = $request->get('tab', 'sales-daily');

        // Sales - Daily
        $today = now()->toDateString();
        $dailyLogs = BalanceLog::whereDate('created_at', $today)
            ->with('user')
            ->orderBy('created_at')
            ->get();

        // Only show PAID items in Recent Transactions (mark_paid)
        $dailyRevenueLogs = $dailyLogs->where('type', 'mark_paid')->values();

        // Reindex to a plain array so Inertia sends a proper JSON list
        $dailyTransactions = $dailyRevenueLogs->map(fn ($log) => [
            'time' => $log->created_at->format('H:i'),
            'type' => $log->type,
            'description' => $log->description,
            'member' => $log->user?->name,
            // Always show paid amounts as positive numbers in reports
            'amount' => (float) abs($log->amount),
            'balance_after' => (float) $log->balance_after,
        ])->values();

        // Treat only mark_paid entries as revenue and use absolute value
        $dailyTotalRevenue = $dailyRevenueLogs->sum(function ($log) {
            return abs((float) $log->amount);
        });
        $dailyTransactionCount = $dailyRevenueLogs->count();

        $dailyEarnings = TimeSession::whereDate('time_in', $today)
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        // Sales - Monthly / Annual
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $monthlyLogs = BalanceLog::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->orderBy('created_at')
            ->get();

        // Only count paid amounts as revenue for the current month
        $monthlyRevenueLogs = $monthlyLogs->where('type', 'mark_paid');

        $monthlyRevenue = $monthlyRevenueLogs->sum(function ($log) {
            return abs((float) $log->amount);
        });
        $monthlyTransactionCount = $monthlyRevenueLogs->count();

        $monthlyEarnings = TimeSession::whereBetween('time_in', [$startOfMonth, $endOfMonth])
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        // For the Sales - Monthly tab, we want a YEAR-wide view grouped by month,
        // with all payment transactions (mark_paid) listed per month.
        $startOfYear = now()->startOfYear();
        $endOfYear = now()->endOfYear();

        $yearLogs = BalanceLog::whereBetween('created_at', [$startOfYear, $endOfYear])
            ->with('user')
            ->orderBy('created_at')
            ->get();

        // Only count paid amounts as revenue for annual/monthly breakdown views
        $yearRevenueLogs = $yearLogs->where('type', 'mark_paid');
        $yearMonthlyTotals = $yearRevenueLogs
            ->groupBy(fn ($log) => $log->created_at->format('Y-m'))
            ->map(fn ($monthLogs) => [
                'month' => $monthLogs->first()->created_at->format('M'),
                'total' => (float) $monthLogs->sum(function ($log) {
                    return abs((float) $log->amount);
                }),
                'count' => $monthLogs->count(),
            ])
            ->values();

        $yearlyRevenue = $yearRevenueLogs->sum(function ($log) {
            return abs((float) $log->amount);
        });
        $yearlyTransactionCount = $yearRevenueLogs->count();

        $annualEarnings = TimeSession::whereBetween('time_in', [$startOfYear, $endOfYear])
            ->whereNotNull('time_out')
            ->where('credits_used', '>', 0)
            ->sum('credits_used');

        // Build detailed monthly totals with transactions for the Sales - Monthly tab
        $monthlyTotalsWithTransactions = $yearRevenueLogs
            ->groupBy(fn ($log) => $log->created_at->format('Y-m'))
            ->map(function ($monthLogs) {
                $first = $monthLogs->first();

                return [
                    'month' => $first->created_at->format('M'),
                    'year' => $first->created_at->format('Y'),
                    'total' => (float) $monthLogs->sum(function ($log) {
                        return abs((float) $log->amount);
                    }),
                    'count' => $monthLogs->count(),
                    'transactions' => $monthLogs->map(function ($log) {
                        return [
                            'time' => $log->created_at->format('Y-m-d H:i'),
                            'type' => $log->type,
                            'description' => $log->description,
                            'member' => $log->user?->name,
                            'amount' => (float) abs($log->amount),
                            'balance_after' => (float) $log->balance_after,
                        ];
                    })->values(),
                ];
            })
            ->values();

        // Time Logs - Daily
        $timeSessionsToday = TimeSession::whereDate('time_in', $today)
            ->with('user')
            ->orderBy('time_in')
            ->get();

        $timeDailyLogs = $timeSessionsToday->map(fn ($session) => [
            'id' => $session->id,
            'member' => $session->user->name,
            'time_in' => $session->time_in?->format('H:i'),
            'time_out' => $session->time_out?->format('H:i'),
            'duration' => $session->getFormattedDuration(),
            'credits_used' => $session->credits_used,
            'is_active' => $session->is_active,
        ]);

        $timeDailyTotalSessions = $timeSessionsToday->count();
        $timeDailyActiveSessions = $timeSessionsToday->where('is_active', true)->count();
        $timeDailyTotalHours = $timeSessionsToday->sum(fn ($s) => $s->getDurationInMinutes() / 60);

        // Time Logs - Year-wide dataset (used for both Monthly and Annual tabs)
        $timeSessionsYear = TimeSession::whereBetween('time_in', [$startOfYear, $endOfYear])
            ->with('user')
            ->orderBy('time_in')
            ->get();

        // For the Time Logs - Monthly tab we want a year-wide monthly breakdown
        // with full session details for each month (similar to Sales - Monthly).
        $timeMonthlyTotals = $timeSessionsYear->groupBy(fn ($session) => $session->time_in->format('Y-m'))
            ->map(function ($monthSessions) {
                $first = $monthSessions->first();

                return [
                    'month' => $first->time_in->format('M'),
                    'year' => $first->time_in->format('Y'),
                    'sessions' => $monthSessions->count(),
                    'hours' => round($monthSessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
                    'members' => $monthSessions->pluck('user_id')->unique()->count(),
                    'logs' => $monthSessions->map(function ($session) {
                        return [
                            'id' => $session->id,
                            'member' => $session->user->name,
                            'time_in' => $session->time_in?->format('Y-m-d H:i'),
                            'time_out' => $session->time_out?->format('Y-m-d H:i'),
                            'duration' => $session->getFormattedDuration(),
                            'credits_used' => $session->credits_used,
                            'is_active' => $session->is_active,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $timeMonthlyTotalSessions = $timeSessionsYear->count();
        $timeMonthlyTotalHours = $timeSessionsYear->sum(fn ($s) => $s->getDurationInMinutes() / 60);
        $timeMonthlyUniqueMembers = $timeSessionsYear->pluck('user_id')->unique()->count();

        // Time Logs - Annual (yearly breakdown over all time)
        $timeSessionsAll = TimeSession::with('user')
            ->orderBy('time_in')
            ->get();

        $timeAnnualMonthlySessions = $timeSessionsAll->groupBy(fn ($session) => $session->time_in->format('Y'))
            ->map(function ($yearSessions, $year) {
                return [
                    'month' => $year, // kept key name for frontend compatibility, value is actually the year
                    'sessions' => $yearSessions->count(),
                    'hours' => round($yearSessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
                    'members' => $yearSessions->pluck('user_id')->unique()->count(),
                    'logs' => $yearSessions->map(function ($session) {
                        return [
                            'id' => $session->id,
                            'member' => $session->user->name,
                            'time_in' => $session->time_in?->format('Y-m-d H:i'),
                            'time_out' => $session->time_out?->format('Y-m-d H:i'),
                            'duration' => $session->getFormattedDuration(),
                            'credits_used' => $session->credits_used,
                            'is_active' => $session->is_active,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $timeAnnualTotalSessions = $timeSessionsAll->count();
        $timeAnnualTotalHours = $timeSessionsAll->sum(fn ($s) => $s->getDurationInMinutes() / 60);
        $timeAnnualUniqueMembers = $timeSessionsAll->pluck('user_id')->unique()->count();

        $timeAnnualTopMembers = $timeSessionsAll->groupBy('user_id')
            ->map(fn ($userSessions) => [
                'name' => $userSessions->first()->user->name,
                'sessions' => $userSessions->count(),
                'hours' => round($userSessions->sum(fn ($s) => $s->getDurationInMinutes() / 60), 2),
            ])
            ->sortByDesc('sessions')
            ->take(10)
            ->values();

        // Get data for all tabs
        $annualSalesData = $this->salesAnnual();
        $timeDailyData = $this->timeDaily();
        
        return Inertia::render('admin/reports', [
            'activeTab' => $activeTab,
            'salesDaily' => [
                'date' => $today,
                'totalRevenue' => (float) $dailyTotalRevenue,
                'dailyEarnings' => (float) $dailyEarnings,
                'transactionCount' => $dailyTransactionCount,
                'transactions' => $dailyTransactions,
            ],
            // Sales - Monthly tab now shows a year-wide monthly breakdown
            'salesMonthly' => [
                'year' => now()->format('Y'),
                'totalRevenue' => (float) $yearlyRevenue,
                'monthlyEarnings' => (float) $annualEarnings,
                'transactionCount' => $yearlyTransactionCount,
                'monthlyTotals' => $monthlyTotalsWithTransactions,
            ],
            // Sales - Annual data
            'salesAnnual' => $annualSalesData,
            'timeDaily' => $timeDailyData,
            'timeMonthly' => [
                'year' => now()->format('Y'),
                'totalSessions' => $timeMonthlyTotalSessions,
                'totalHours' => round($timeMonthlyTotalHours, 2),
                'uniqueMembers' => $timeMonthlyUniqueMembers,
                'monthlyTotals' => $timeMonthlyTotals,
            ],
            'timeAnnual' => [
                'year' => now()->format('Y'),
                'totalSessions' => $timeAnnualTotalSessions,
                'totalHours' => round($timeAnnualTotalHours, 2),
                'uniqueMembers' => $timeAnnualUniqueMembers,
                'monthlySessions' => $timeAnnualMonthlySessions,
                'topMembers' => $timeAnnualTopMembers,
            ],
        ]);
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
        // Get all payment transactions with user relationship
        $allTimeLogs = BalanceLog::with('user')
            ->where('type', 'mark_paid')
            ->orderBy('created_at')
            ->get();

        // Group by year and prepare data
        $annualTotals = $allTimeLogs->groupBy(fn($log) => $log->created_at->format('Y'))
            ->map(function ($yearLogs, $year) {
                return [
                    'year' => $year,
                    'total' => (float) $yearLogs->sum(fn($log) => abs((float) $log->amount)),
                    'count' => $yearLogs->count(),
                    'transactions' => $yearLogs->map(function ($log) {
                        return [
                            'time' => $log->created_at->format('Y-m-d H:i'),
                            'type' => $log->type,
                            'description' => $log->description,
                            'member' => $log->user?->name,
                            'amount' => (float) abs($log->amount),
                            'balance_after' => (float) $log->balance_after,
                        ];
                    })->values(),
                ];
            })
            ->sortByDesc('year')
            ->values();

        return [
            'totalRevenue' => (float) $allTimeLogs->sum(fn($log) => abs((float) $log->amount)),
            'transactionCount' => $allTimeLogs->count(),
            'annualTotals' => $annualTotals,
        ];
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

        return [
            'date' => $today,
            'totalSessions' => $totalSessions,
            'activeSessions' => $activeSessions,
            'totalHours' => round($totalHours, 2),
            'timeLogs' => $timeLogs,
        ];
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
