<?php

namespace App\Http\Controllers;

use App\Models\User;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRMarkupSVG;
use chillerlan\QRCode\Output\QROutputInterface;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function home()
    {
        /** @var User */
        $user = Auth::user();
        $member = $user->member;

        // Prepare avatar URL for both home and profile views
        $avatarUrl = null;
        if ($member) {
            $dir = "avatars/{$user->id}";
            $all = collect(Storage::disk('public')->allFiles($dir))
                ->filter(function ($path) {
                    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    return in_array($ext, ['jpg','jpeg','png','gif','webp']);
                })
                ->sortByDesc(function ($path) {
                    $full = storage_path('app/public/' . $path);
                    return @filemtime($full) ?: 0;
                })
                ->values();

            $avatarFile = $all->first();
            if ($avatarFile) {
                $basePath = '/storage/' . ltrim($avatarFile, '/');
                $fullPath = storage_path('app/public/' . $avatarFile);
                $ver = @filemtime($fullPath) ?: time();
                $avatarUrl = $basePath . '?v=' . $ver;
            }
        }

        if ($member) {
            // Generate QR code for time tracking - now contains a URL endpoint
            $qrData = route('qr.time-track', ['user' => $user->id]);

            $options = new QROptions();
            $options->outputType = QROutputInterface::MARKUP_SVG;
            $options->outputBase64 = false; // Disable base64 encoding
            $options->eccLevel = EccLevel::M;
            $options->scale = 6;
            $options->moduleValues = [
                // Light modules (background)
                1024 => '#1e293b',
                // Dark modules (foreground)
                4 => '#e2e8f0'
            ];
            $options->addQuietzone = true;

            $qrCode = new QRCode($options);
            $qrCodeSvg = $qrCode->render($qrData);

            $memberData = [
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
                'qrCode' => $qrCodeSvg,
                'avatarUrl' => $avatarUrl,
            ];
        } else {
            $memberData = null;
        }

        $activeSession = $user->getActiveTimeSession();
        $todaysSessions = $user->getTodaysTimeSessions();

        $balanceLogs = $user->balanceLogs()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'createdAt' => $log->created_at->format('Y-m-d H:i'),
                    'type' => $log->type,
                    'description' => $log->description,
                    'amount' => (float) $log->amount,
                    'balanceAfter' => (float) $log->balance_after,
                ];
            });

        return Inertia::render('member-home', [
            'member' => $memberData,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'balance' => $user->balance,
                'live_balance' => $user->getLiveBalance(),
                'formatted_balance' => $user->getFormattedBalance(),
                'formatted_live_balance' => $user->getFormattedLiveBalance(),
            ],
            'timeTracking' => [
                'active_session' => $activeSession ? [
                    'id' => $activeSession->id,
                    'time_in' => $activeSession->time_in->format('H:i'),
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
            ],
            'balanceLogs' => $balanceLogs,
        ]);
    }

    /**
     * Show the workout plans page with the member's own plan (if any).
     */
    public function workoutPlans()
    {
        /** @var User $user */
        $user = Auth::user();
        $member = $user->member;

        if ($member) {
            // Normalize legacy single plan into slot 1 if multi-slots are empty
            $plans = $member->workout_plans ?? [];
            if (empty($plans) && !empty($member->workout_plan)) {
                $plans = [
                    ['name' => 'Plan 1', 'content' => $member->workout_plan],
                ];
            }

            $activeSlot = $member->active_workout_plan ?? 1;

            $memberPayload = [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'workout_plans' => array_values($plans),
                'active_workout_plan' => $activeSlot,
            ];
        } else {
            $memberPayload = null;
        }

        return Inertia::render('member-workout-plans', [
            'member' => $memberPayload,
        ]);
    }

    /**
     * Save/update the authenticated member's personal workout plan.
     */
    public function saveWorkoutPlan(Request $request)
    {
        $validated = $request->validate([
            'workout_plans' => ['required', 'array', 'size:3'],
            'workout_plans.*.name' => ['nullable', 'string', 'max:100'],
            'workout_plans.*.content' => ['nullable', 'string', 'max:5000'],
            'active_workout_plan' => ['required', 'integer', 'min:1', 'max:3'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $member = $user->member;

        if ($member) {
            $member->workout_plans = $validated['workout_plans'];
            $member->active_workout_plan = $validated['active_workout_plan'];

            // Keep legacy single field in sync with active slot for backwards compatibility
            $activeIndex = $member->active_workout_plan - 1;
            $activePlan = $validated['workout_plans'][$activeIndex]['content'] ?? null;
            $member->workout_plan = $activePlan;

            $member->save();
        }

        return redirect()->route('member.workout-plans')->with('success', 'Your workout plans have been saved.');
    }

    /**
     * Show a dedicated page for the member's balance history
     */
    public function balanceLogs()
    {
        /** @var User $user */
        $user = Auth::user();

        $balanceLogs = $user->balanceLogs()
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'createdAt' => $log->created_at->format('Y-m-d H:i'),
                    'type' => $log->type,
                    'description' => $log->description,
                    'amount' => (float) $log->amount,
                    'balanceAfter' => (float) $log->balance_after,
                ];
            });

        return Inertia::render('member-balance-logs', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'balanceLogs' => $balanceLogs,
        ]);
    }

    /**
     * Show progress tracking with real data from time sessions.
     */
    public function progress()
    {
        /** @var User $user */
        $user = Auth::user();

        // Pull all sessions for this user (you can limit by date range if needed)
        $sessions = $user->timeSessions()
            ->orderBy('time_in')
            ->get();

        // Monthly check-ins for the last 3 months (including current)
        $now = now();
        $months = [];
        for ($i = 2; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $key = $month->format('Y-m');
            $months[$key] = [
                'label' => $month->format('M'),
                'count' => 0,
            ];
        }

        foreach ($sessions as $session) {
            if (!$session->time_in) {
                continue;
            }
            $key = $session->time_in->format('Y-m');
            if (array_key_exists($key, $months)) {
                $months[$key]['count']++;
            }
        }

        $monthlyCheckIns = array_values($months);
        $maxMonthly = max(array_column($monthlyCheckIns, 'count')) ?: 1;

        // Estimated time spent (in hours, rounded to 1 decimal)
        $totalMinutes = 0;
        foreach ($sessions as $session) {
            $totalMinutes += $session->getDurationInMinutes();
        }
        $estimatedHours = round($totalMinutes / 60, 1);

        // Consistency streak: best number of consecutive weeks with at least one session
        $weeks = [];
        foreach ($sessions as $session) {
            if (!$session->time_in) {
                continue;
            }
            $yearWeek = $session->time_in->format('o-W'); // ISO year-week
            $weeks[$yearWeek] = true;
        }

        $uniqueWeeks = array_keys($weeks);
        sort($uniqueWeeks);

        $bestStreak = 0;
        $currentStreak = 0;
        $prevYearWeek = null;

        foreach ($uniqueWeeks as $yearWeek) {
            if ($prevYearWeek === null) {
                $currentStreak = 1;
            } else {
                [$prevYear, $prevWeek] = array_map('intval', explode('-', $prevYearWeek));
                [$year, $week] = array_map('intval', explode('-', $yearWeek));

                $expectedWeek = $prevWeek + 1;
                $expectedYear = $prevYear;
                if ($expectedWeek > 53) {
                    $expectedWeek = 1;
                    $expectedYear++;
                }

                if ($year === $expectedYear && $week === $expectedWeek) {
                    $currentStreak++;
                } else {
                    $currentStreak = 1;
                }
            }

            $bestStreak = max($bestStreak, $currentStreak);
            $prevYearWeek = $yearWeek;
        }

        return Inertia::render('member-progress', [
            'monthlyCheckIns' => array_map(function ($item) use ($maxMonthly) {
                return [
                    'label' => $item['label'],
                    'count' => $item['count'],
                    'ratio' => $item['count'] > 0 ? $item['count'] / $maxMonthly : 0,
                ];
            }, $monthlyCheckIns),
            'estimatedHours' => $estimatedHours,
            'bestStreakWeeks' => $bestStreak,
        ]);
    }

    /**
     * Admin view: show a member's QR card for printing
     */
    public function adminQr(User $user)
    {
        $member = $user->member;

        if (!$member) {
            abort(404);
        }

        $avatarUrl = null;
        $dir = "avatars/{$user->id}";
        $all = collect(Storage::disk('public')->allFiles($dir))
            ->filter(function ($path) {
                $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                return in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
            })
            ->sortByDesc(function ($path) {
                $full = storage_path('app/public/' . $path);
                return @filemtime($full) ?: 0;
            })
            ->values();

        $avatarFile = $all->first();
        if ($avatarFile) {
            $basePath = '/storage/' . ltrim($avatarFile, '/');
            $fullPath = storage_path('app/public/' . $avatarFile);
            $ver = @filemtime($fullPath) ?: time();
            $avatarUrl = $basePath . '?v=' . $ver;
        }

        $qrData = route('qr.time-track', ['user' => $user->id]);

        $options = new QROptions();
        $options->outputType = QROutputInterface::MARKUP_SVG;
        $options->outputBase64 = false;
        $options->eccLevel = EccLevel::M;
        $options->scale = 6;
        $options->moduleValues = [
            1024 => '#1e293b',
            4 => '#e2e8f0',
        ];
        $options->addQuietzone = true;

        $qrCode = new QRCode($options);
        $qrCodeSvg = $qrCode->render($qrData);

        $memberData = [
            'id' => $member->id,
            'fullName' => $member->full_name,
            'email' => $member->email,
            'phone' => $member->phone,
            'plan' => $member->plan->value,
            'endDate' => $member->end_date->format('Y-m-d'),
            'qrCode' => $qrCodeSvg,
            'avatarUrl' => $avatarUrl,
        ];

        return Inertia::render('admin/member-qr', [
            'member' => $memberData,
        ]);
    }

    /**
     * Show the member profile page
     */
    public function profile()
    {
        /** @var User $user */
        $user = Auth::user();
        $member = $user->member;

        $dir = "avatars/{$user->id}";
        $all = collect(Storage::disk('public')->allFiles($dir))
            ->filter(function ($path) {
                $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                return in_array($ext, ['jpg','jpeg','png','gif','webp']);
            })
            ->sortByDesc(function ($path) {
                $full = storage_path('app/public/' . $path);
                return @filemtime($full) ?: 0;
            })
            ->values();

        $avatarFile = $all->first();
        $avatarUrl = null;
        if ($avatarFile) {
            $basePath = '/storage/' . ltrim($avatarFile, '/');
            $fullPath = storage_path('app/public/' . $avatarFile);
            $ver = @filemtime($fullPath) ?: time();
            $avatarUrl = $basePath . '?v=' . $ver;
        }

        return Inertia::render('member-profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'member' => $member ? [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'plan' => $member->plan,
                'start_date' => optional($member->start_date)->format('F d, Y'),
                'end_date' => $member->plan && $member->plan->value === 'Daily'
                    ? 'Present (Daily)'
                    : optional($member->end_date)->format('F d, Y'),
                'phone' => $member->phone,
                'notes' => $member->notes,
                'renewals' => (int)($member->renewals ?? 0),
                'status' => $member->status,
            ] : null,
            'avatarUrl' => $avatarUrl,
        ]);
    }

    /**
     * Upload/update avatar image
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $dir = "avatars/{$user->id}";
        // Clear existing files in public disk
        if (Storage::disk('public')->exists($dir)) {
            foreach (Storage::disk('public')->files($dir) as $old) {
                Storage::disk('public')->delete($old);
            }
        }
        $file = $request->file('avatar');
        $path = $file->storePublicly($dir, ['disk' => 'public']);

        return redirect()->back()->with('success', 'Profile photo updated.');
    }

    /**
     * Update the authenticated member's password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        $user->password = Hash::make($request->input('password'));
        $user->save();

        return redirect()->back()->with('success', 'Password updated successfully.');
    }
}
