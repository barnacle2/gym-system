<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\ReportsController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        /** @var User $user */
        $user = Auth::user();
        if ($user->isAdmin()) {
            return redirect()->route('dashboard');
        }
        return redirect()->route('member.home');
    }
    return redirect()->route('login');
})->name('home');

// Member routes (require authentication)
Route::middleware(['auth'])->group(function () {
    Route::get('member/home', [MemberController::class, 'home'])->name('member.home');
    Route::get('member/balance-logs', [MemberController::class, 'balanceLogs'])->name('member.balance-logs');

    // Member quick actions
    Route::get('member/classes', fn () => Inertia::render('member-classes'))->name('member.classes');
    Route::get('member/workout-plans', [MemberController::class, 'workoutPlans'])->name('member.workout-plans');
    Route::post('member/workout-plans', [MemberController::class, 'saveWorkoutPlan'])->name('member.workout-plans.save');
    Route::get('member/progress', [MemberController::class, 'progress'])->name('member.progress');
});

// Admin-only routes
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('members', [DashboardController::class, 'store'])->name('members.store');
    Route::put('members/{member}', [DashboardController::class, 'update'])->name('members.update');
    Route::patch('members/{member}/toggle-status', [DashboardController::class, 'toggleStatus'])->name('members.toggle-status');
    Route::patch('members/{member}/renew', [DashboardController::class, 'renew'])->name('members.renew');
    Route::post('members/{member}/send-password-reset', [DashboardController::class, 'sendPasswordReset'])->name('members.send-password-reset');
    Route::delete('members/{member}', [DashboardController::class, 'destroy'])->name('members.destroy');

    // Admin-driven password reset (set new password for member)
    Route::get('admin/members/{member}/reset-password', [DashboardController::class, 'editPassword'])->name('admin.members.reset-password');
    Route::post('admin/members/{member}/reset-password', [DashboardController::class, 'updatePassword'])->name('admin.members.update-password');

    // Balance management routes
    Route::get('admin/balances', [DashboardController::class, 'balances'])->name('admin.balances');
    Route::post('admin/users/{user}/balance', [DashboardController::class, 'updateBalance'])->name('admin.users.balance');
    Route::get('admin/users/{user}/summary', [DashboardController::class, 'userSummary'])->name('admin.users.summary');
    Route::get('admin/users/{user}/balance-logs', [DashboardController::class, 'userBalanceLogs'])->name('admin.users.balance-logs');

    // Simple POS-style transactions that affect member balances
    Route::get('admin/transactions', [DashboardController::class, 'transactionsForm'])->name('admin.transactions');
    Route::post('admin/transactions', [DashboardController::class, 'storeTransaction'])->name('admin.transactions.store');

    // Admin view for member QR card
    Route::get('admin/members/{user}/qr', [MemberController::class, 'adminQr'])->name('admin.members.qr');

    // Time logs
    Route::get('admin/time-logs', [TimeTrackingController::class, 'adminLogs'])->name('admin.time-logs');

    // Reports
    Route::get('admin/reports', [ReportsController::class, 'index'])->name('admin.reports');
});

Route::middleware(['auth'])->group(function () {
    Route::get('admin-dashboard', function () {
        return Inertia::render('dashboard');
    })->name('admin.dashboard');

    // Member self-service
    Route::get('member/profile', [\App\Http\Controllers\MemberController::class, 'profile'])->name('member.profile');
    Route::post('member/update-password', [\App\Http\Controllers\MemberController::class, 'updatePassword'])->name('member.update-password');
    Route::post('member/update-avatar', [\App\Http\Controllers\MemberController::class, 'updateAvatar'])->name('member.update-avatar');
});

// Time tracking routes
Route::middleware(['auth'])->group(function () {
    Route::post('/api/time-tracking/toggle', [App\Http\Controllers\TimeTrackingController::class, 'toggleTimeTracking'])->name('time-tracking.toggle');
    Route::get('/api/time-tracking/status', [App\Http\Controllers\TimeTrackingController::class, 'getStatus'])->name('time-tracking.status');
    Route::get('/api/time-tracking/live-balance', [App\Http\Controllers\TimeTrackingController::class, 'getLiveBalance'])->name('time-tracking.live-balance');
});

// QR code endpoint for time tracking (no auth middleware - public endpoint for gym scanners)
Route::get('/qr/time-track/{user}', [App\Http\Controllers\TimeTrackingController::class, 'qrTimeTrack'])->name('qr.time-track');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
