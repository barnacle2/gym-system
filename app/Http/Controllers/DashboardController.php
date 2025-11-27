<?php

namespace App\Http\Controllers;

use App\Enums\MembershipPlan;
use App\Models\BalanceLog;
use App\Models\Member;
use App\Models\TimeSession;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $members = Member::with('user')->get()->map(function ($member) {
            return [
                'id' => $member->id,
                'fullName' => $member->full_name,
                'email' => $member->email,
                'phone' => $member->phone,
                'plan' => $member->plan->value,
                'startDate' => $member->start_date->format('Y-m-d'),
                'endDate' => $member->end_date->format('Y-m-d'),
                'notes' => $member->notes,
                'inactive' => $member->inactive,
                'createdAt' => $member->created_at->toISOString(),
                'updatedAt' => $member->updated_at->toISOString(),
                'renewals' => $member->renewals,
                'status' => $member->status,
                'hasUserAccount' => $member->user !== null,
                'userId' => $member->user_id,
            ];
        });

        // Recent activity: last 5 time sessions
        $recentSessions = TimeSession::with(['user:id,name,email'])
            ->orderBy('time_in', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'user' => [
                        'id' => $s->user->id,
                        'name' => $s->user->name,
                        'email' => $s->user->email,
                    ],
                    'time_in' => $s->time_in?->toDateTimeString(),
                    'time_out' => $s->time_out?->toDateTimeString(),
                    'duration' => $s->getFormattedDuration(),
                    'is_active' => $s->is_active,
                ];
            });

        $activeSessionsToday = TimeSession::active()->byDate(today())->count();

        return Inertia::render('gym-dashboard', [
            'members' => $members,
            'recentSessions' => $recentSessions,
            'activeSessionsToday' => $activeSessionsToday,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'plan' => 'required|in:Daily,Monthly,Quarterly,Semi-Annual,Annual',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        // Auto-calculate end date if not provided
        if (empty($validated['end_date'])) {
            $startDate = new \DateTime($validated['start_date']);
            $plan = \App\Enums\MembershipPlan::from($validated['plan']);

            if ($plan === \App\Enums\MembershipPlan::DAILY) {
                // Daily plan: treat membership as same-day; end date equals start date
                $validated['end_date'] = $startDate->format('Y-m-d');
            } else {
                $validated['end_date'] = $startDate->modify('+' . $plan->months() . ' months')->format('Y-m-d');
            }
        }

        $user = null;

        // Create User account if email is provided
        if (!empty($validated['email'])) {
            // Default password for new accounts
            $defaultPassword = 'password';

            // Determine initial balance based on plan
            $initialBalance = 400.00;
            $planEnum = MembershipPlan::from($validated['plan']);
            if ($planEnum === MembershipPlan::DAILY) {
                // Daily members should start with no outstanding subscription balance
                $initialBalance = 0.00;
            }

            $user = User::create([
                'name' => $validated['full_name'],
                'email' => $validated['email'],
                'password' => Hash::make($defaultPassword),
                'is_admin' => false,
                'email_verified_at' => now(), // Auto-verify email
                'balance' => $initialBalance,
            ]);

            // Send password reset link so user can set their own password
            $status = Password::sendResetLink(['email' => $user->email]);

            $resetLinkSent = $status === Password::RESET_LINK_SENT;
        }        // Create member record
        $memberData = $validated;
        if ($user) {
            $memberData['user_id'] = $user->id;
        }

        Member::create($memberData);

        $successMessage = 'Member created successfully!';
        if ($user) {
            $successMessage .= isset($resetLinkSent) && $resetLinkSent
                ? ' Password reset link sent to member\'s email.'
                : ' User account created - password reset link could not be sent.';
        } else {
            $successMessage .= ' (No email provided for login access).';
        }

        return redirect()->back()->with('success', $successMessage);
    }

    public function update(Request $request, Member $member)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . ($member->user_id ?? 'NULL'),
            'phone' => 'nullable|string|max:20',
            'plan' => 'required|in:Daily,Monthly,Quarterly,Semi-Annual,Annual',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        // Handle User account updates
        if (!empty($validated['email'])) {
            if ($member->user) {
                // Update existing user
                $member->user->update([
                    'name' => $validated['full_name'],
                    'email' => $validated['email'],
                ]);
            } else {
                // Create new user account
                $defaultPassword = 'password';

                $user = User::create([
                    'name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($defaultPassword),
                    'is_admin' => false,
                    'email_verified_at' => now(), // Auto-verify email
                ]);

                $validated['user_id'] = $user->id;
            }
        } else {
            // If email is removed, we could optionally delete the user account
            // For now, we'll just keep the account but remove the link
            $validated['user_id'] = null;
        }

        $member->update($validated);

        return redirect()->back()->with('success', 'Member updated successfully!');
    }

    public function toggleStatus(Member $member)
    {
        $member->toggleStatus();
        return redirect()->back();
    }

    public function renew(Member $member)
    {
        $member->renew();
        return redirect()->back();
    }

    public function sendPasswordReset(Member $member)
    {
        if (!$member->user || !$member->email) {
            return redirect()->back()->with('error', 'Member does not have a user account or email address.');
        }

        $status = Password::sendResetLink(['email' => $member->user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return redirect()->back()->with('success', 'Password reset link sent to ' . $member->email);
        }

        return redirect()->back()->with('error', 'Unable to send password reset link.');
    }

    /**
     * Show admin password reset form for a member
     */
    public function editPassword(Member $member)
    {
        return Inertia::render('admin/member-reset-password', [
            'member' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'email' => $member->email,
            ],
        ]);
    }

    /**
     * Admin updates a member's login password directly
     */
    public function updatePassword(Request $request, Member $member)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Ensure the member has a user account
        $user = $member->user;
        if (!$user) {
            // Create a user account if it doesn't exist yet
            $user = User::create([
                'name' => $member->full_name,
                'email' => $member->email,
                'password' => Hash::make($validated['password']),
                'is_admin' => false,
                'email_verified_at' => now(),
            ]);

            $member->user_id = $user->id;
            $member->save();
        } else {
            $user->password = Hash::make($validated['password']);
            $user->save();
        }

        return redirect()->route('dashboard')->with('success', 'Member password has been updated.');
    }

    /**
     * Admin: delete a member (and their user account if applicable)
     */
    public function destroy(Member $member)
    {
        $user = $member->user;

        // Delete the member record first
        $member->delete();

        // Optionally delete the linked user account if it's not an admin
        if ($user && !$user->isAdmin()) {
            // Time sessions and balance logs should be cascaded by DB constraints if configured
            $user->delete();
        }

        return redirect()->back()->with('success', 'Member account deleted successfully.');
    }

    /**
     * Show users with their balances for admin management
     */
    public function balances(Request $request)
    {
        $users = User::select(['id', 'name', 'email', 'balance', 'is_admin'])
            ->where('is_admin', false)
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'balance' => $user->balance,
                    'formattedBalance' => $user->getFormattedBalance(),
                    'isAdmin' => $user->is_admin,
                ];
            });

        return Inertia::render('admin/balance-management', [
            'users' => $users,
            'openUserId' => $request->integer('user_id') ?: null,
        ]);
    }

    /**
     * Admin: simple transactions (purchases) that increase member balance
     */
    public function transactionsForm()
    {
        $users = User::select(['id', 'name', 'email'])
            ->where('is_admin', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/transactions', [
            'users' => $users,
        ]);
    }

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'product' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0.01|max:999999.99',
        ]);

        /** @var User $user */
        $user = User::findOrFail($validated['user_id']);

        // Increase balance
        $amount = (float) $validated['amount'];
        $user->addBalance($amount);

        // Log transaction
        $logDescription = trim('Product: ' . $validated['product'] . (
            !empty($validated['description']) ? ' — ' . $validated['description'] : ''
        ));

        BalanceLog::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'balance_after' => $user->balance,
            'type' => 'purchase',
            'description' => $logDescription,
        ]);

        return redirect()
            ->route('admin.balances', ['user_id' => $user->id])
            ->with('success', 'Transaction recorded and balance updated.');
    }

    /**
     * Update a user's balance
     */
    public function updateBalance(Request $request, User $user)
    {
        $validated = $request->validate([
            'balance' => 'required|numeric|min:0|max:999999.99',
            'action' => 'required|string|in:set,add,subtract',
            'log_type' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);

        $newBalance = $validated['balance'];
        $oldBalance = $user->balance;
        $amountChange = 0.0;
        $type = null;
        $description = null;

        switch ($validated['action']) {
            case 'set':
                $user->setBalance($newBalance);
                $message = "Balance set to " . $user->getFormattedBalance();
                $amountChange = (float) $user->balance - (float) $oldBalance;
                $type = 'admin_set';
                $description = 'Admin set balance';
                break;
            case 'add':
                $user->addBalance($newBalance);
                $message = "Added ₱" . number_format($newBalance, 2) . " to balance. New balance: " . $user->getFormattedBalance();
                $amountChange = (float) $newBalance;
                $type = 'admin_add';
                $description = 'Admin added to balance';
                break;
            case 'subtract':
                if (!$user->hasSufficientBalance($newBalance)) {
                    return redirect()->back()->with('error', 'Insufficient balance for this operation.');
                }
                $user->deductBalance($newBalance);
                $message = "Deducted ₱" . number_format($newBalance, 2) . " from balance. New balance: " . $user->getFormattedBalance();
                $amountChange = -1 * (float) $newBalance;
                $type = 'admin_subtract';
                $description = 'Admin deducted from balance';
                break;
        }

        // Allow caller to override log type/description (e.g. mark as paid with specific reason)
        if (!empty($validated['log_type'])) {
            $type = $validated['log_type'];
        }
        if (array_key_exists('description', $validated) && $validated['description'] !== null) {
            $description = $validated['description'];
        }

        if ($type !== null && $amountChange != 0.0) {
            BalanceLog::create([
                'user_id' => $user->id,
                'amount' => $amountChange,
                'balance_after' => $user->balance,
                'type' => $type,
                'description' => $description,
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Admin: non-subscription balance logs for a user (JSON)
     */
    public function userBalanceLogs(User $user)
    {
        // Find the most recent payment that marked previous items as paid
        $lastPaymentId = $user->balanceLogs()
            ->where('type', 'mark_paid')
            ->max('id');

        $query = $user->balanceLogs()
            ->where('amount', '>', 0);

        // If there has been at least one payment, only show purchases after that payment.
        // This prevents older, already-paid purchases from reappearing when new charges are added.
        if ($lastPaymentId) {
            $query->where('id', '>', $lastPaymentId);
        }

        $logs = $query
            ->orderByDesc('created_at')
            ->limit(50)
            ->get([
                'id',
                'amount',
                'balance_after',
                'type',
                'description',
                'created_at',
            ]);

        // If there are no granular logs but the user still has a positive balance,
        // synthesize a virtual subscription fee entry so admins can mark it as paid.
        // Skip this for Daily plan members since they are pay-as-you-go.
        $member = $user->member;
        $isDailyPlan = $member && $member->plan instanceof MembershipPlan && $member->plan === MembershipPlan::DAILY;

        if ($logs->isEmpty() && $user->balance > 0 && !$isDailyPlan) {
            $logs = collect([
                [
                    'id' => -1, // virtual row, not an actual BalanceLog ID
                    'amount' => (float) $user->balance,
                    'balance_after' => (float) $user->balance,
                    'type' => 'subscription_fee',
                    'description' => 'Monthly gym subscription fee (current outstanding membership)',
                    'created_at' => now(),
                ],
            ]);
        }

        return response()->json($logs->values());
    }

    /**
     * Admin: User subscription summary and recent activities (JSON)
     */
    public function userSummary(User $user)
    {
        $member = $user->member;

        $subscription = $member ? [
            'plan' => $member->plan->value,
            'start_date' => $member->start_date?->format('Y-m-d'),
            'end_date' => $member->end_date?->format('Y-m-d'),
            'notes' => $member->notes,
            'status' => $member->status, // includes code/label/daysLeft
            'renewals' => $member->renewals,
        ] : null;

        $recentSessions = TimeSession::where('user_id', $user->id)
            ->orderBy('time_in', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'time_in' => $s->time_in?->toDateTimeString(),
                    'time_out' => $s->time_out?->toDateTimeString(),
                    'duration' => $s->getFormattedDuration(),
                    'is_active' => $s->is_active,
                ];
            });

        // Placeholder for purchases history (inventory not implemented yet)
        $purchases = [];

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'subscription' => $subscription,
            'recent_sessions' => $recentSessions,
            'purchases' => $purchases,
        ]);
    }
}
