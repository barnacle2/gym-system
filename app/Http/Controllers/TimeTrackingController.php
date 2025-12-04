<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TimeSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TimeTrackingController extends Controller
{
    /**
     * Handle time in/out action via QR scan or API
     */
    public function toggleTimeTracking(Request $request)
    {
        $request->validate([
            'user_id' => 'sometimes|exists:users,id',
            'action' => 'sometimes|in:time_in,time_out',
        ]);

        // Use authenticated user if no user_id provided (for member self-service)
        $user = $request->user_id
            ? User::findOrFail($request->user_id)
            : Auth::user();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Subscription model: no balance check required for time in
        $activeSession = $user->getActiveTimeSession();

        try {
            if ($activeSession) {
                // Time out
                $session = $user->timeOut();
                $action = 'time_out';
                $message = 'Successfully timed out';
            } else {
                // Time in
                $session = $user->timeIn();
                $action = 'time_in';
                $message = 'Successfully timed in';
            }

            $payload = [
                'success' => true,
                'message' => $message,
                'action' => $action,
                'session' => [
                    'id' => $session->id,
                    'time_in' => $session->time_in->toISOString(),
                    'time_out' => $session->time_out?->toISOString(),
                    'duration' => $session->getFormattedDuration(),
                    'credits_used' => $session->getLiveBalanceDeduction(),
                    'is_active' => $session->is_active,
                ],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'balance' => $user->balance,
                    'live_balance' => $user->getLiveBalance(),
                    'formatted_balance' => $user->getFormattedBalance(),
                    'formatted_live_balance' => $user->getFormattedLiveBalance(),
                ],
            ];

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json($payload);
            }
            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'error' => 'Failed to process time tracking',
                    'message' => $e->getMessage(),
                ], 500);
            }
            return redirect()->back()->with('error', 'Failed to process time tracking.');
        }
    }

    /**
     * Get user's current time tracking status
     */
    public function getStatus(Request $request)
    {
        $user = $request->user_id
            ? User::findOrFail($request->user_id)
            : Auth::user();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $activeSession = $user->getActiveTimeSession();
        $todaysSessions = $user->getTodaysTimeSessions();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'balance' => $user->balance,
                'live_balance' => $user->getLiveBalance(),
                'formatted_balance' => $user->getFormattedBalance(),
                'formatted_live_balance' => $user->getFormattedLiveBalance(),
            ],
            'active_session' => $activeSession ? [
                'id' => $activeSession->id,
                'time_in' => $activeSession->time_in->toISOString(),
                'duration' => $activeSession->getFormattedDuration(),
                'credits_used' => $activeSession->getLiveBalanceDeduction(),
            ] : null,
            'todays_sessions' => $todaysSessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'time_in' => $session->time_in->format('H:i'),
                    'time_out' => $session->time_out?->format('H:i'),
                    'duration' => $session->getFormattedDuration(),
                    'credits_used' => $session->credits_used,
                    'is_active' => $session->is_active,
                ];
            }),
            'next_action' => $activeSession ? 'time_out' : 'time_in',
        ]);
    }

    /**
     * Get live balance update (for real-time updates)
     */
    public function getLiveBalance(Request $request)
    {
        $user = $request->user_id
            ? User::findOrFail($request->user_id)
            : Auth::user();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $activeSession = $user->getActiveTimeSession();

        return response()->json([
            'balance' => $user->balance,
            'live_balance' => $user->getLiveBalance(),
            'formatted_balance' => $user->getFormattedBalance(),
            'formatted_live_balance' => $user->getFormattedLiveBalance(),
            'active_session' => $activeSession ? [
                'duration' => $activeSession->getFormattedDuration(),
                'credits_used' => $activeSession->getLiveBalanceDeduction(),
            ] : null,
        ]);
    }

    /**
     * Handle QR code time tracking endpoint
     * This is accessed when scanning the QR code at gym scanners
     */
    public function qrTimeTrack(User $user)
    {
        // Check if user exists and has a member record
        if (!$user->member) {
            return response()->view('qr-result', [
                'success' => false,
                'message' => 'Member not found or invalid QR code.',
                'user' => null,
            ], 404);
        }
        
        $member = $user->member;

        // Block QR access for inactive or expired memberships (any plan)
        $status = $member->status;
        if ($member->inactive || ($status['code'] ?? null) === 'EXPIRED') {
            return response()->view('qr-result', [
                'success' => false,
                'message' => 'Membership is inactive or expired. Please renew at the front desk.',
                'user' => [
                    'name' => $user->name,
                    'plan' => $member->plan?->value,
                    'balance' => null,
                    'show_balance' => false,
                ],
            ], 403);
        }

        $activeSession = $user->getActiveTimeSession();

        try {
            if ($activeSession) {
                // Time out
                $session = $user->timeOut();
                $action = 'time_out';
                $message = 'Successfully timed out! See you next time.';
            } else {
                // Time in
                $session = $user->timeIn();
                $action = 'time_in';
                $message = 'Successfully timed in! Enjoy your workout.';
            }

            return response()->view('qr-result', [
                'success' => true,
                'message' => $message,
                'action' => $action,
                'user' => [
                    'name' => $user->name,
                    'plan' => $member->plan?->value,
                    'balance' => $user->getFormattedLiveBalance(),
                    // Only Daily plan uses balance/credits; others use flat subscription
                    'show_balance' => $member->plan && $member->plan->value === 'Daily',
                ],
                'session' => [
                    'time_in' => $session->time_in->format('h:i A'),
                    'time_out' => $session->time_out?->format('h:i A'),
                    'duration' => $session->getFormattedDuration(),
                    'credits_used' => $session->getLiveBalanceDeduction(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->view('qr-result', [
                'success' => false,
                'message' => 'Failed to process time tracking. Please try again.',
                'user' => [
                    'name' => $user->name,
                    'plan' => $member->plan?->value ?? null,
                    'balance' => $user->getFormattedLiveBalance(),
                    'show_balance' => $member->plan && $member->plan->value === 'Daily',
                ],
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: View time logs with filters and pagination
     */
    public function adminLogs(Request $request)
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'user_id' => 'nullable|exists:users,id',
            'active' => 'nullable|in:0,1',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        $perPage = $filters['per_page'] ?? 20;

        $query = TimeSession::with(['user:id,name,email', 'user.member'])
            ->when(!empty($filters['user_id']), function ($q) use ($filters) {
                $q->where('user_id', $filters['user_id']);
            })
            ->when(isset($filters['active']), function ($q) use ($filters) {
                $q->where('is_active', (bool) $filters['active']);
            })
            ->when(!empty($filters['date_from']), function ($q) use ($filters) {
                $q->whereDate('time_in', '>=', $filters['date_from']);
            })
            ->when(!empty($filters['date_to']), function ($q) use ($filters) {
                $q->whereDate('time_in', '<=', $filters['date_to']);
            })
            ->orderBy('time_in', 'desc');

        $sessions = $query->paginate($perPage)->through(function ($s) {
            return [
                'id' => $s->id,
                'user' => [
                    'id' => $s->user->id,
                    'name' => $s->user->name,
                    'email' => $s->user->email,
                ],
                'plan' => optional($s->user->member)->plan?->value,
                'time_in' => $s->time_in?->toDateTimeString(),
                'time_out' => $s->time_out?->toDateTimeString(),
                'duration' => $s->getFormattedDuration(),
                'credits_used' => $s->getLiveBalanceDeduction(),
                'is_active' => $s->is_active,
                'notes' => $s->notes,
            ];
        })->withQueryString();

        $users = User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/time-logs', [
            'sessions' => $sessions,
            'filters' => [
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'user_id' => $filters['user_id'] ?? null,
                'active' => $filters['active'] ?? null,
                'per_page' => $perPage,
            ],
            'users' => $users,
        ]);
    }
}
