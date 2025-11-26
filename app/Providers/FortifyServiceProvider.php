<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureAuthentication();
        $this->configureLoginRedirects();
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }

    /**
     * Configure authentication rules (e.g. block inactive members).
     */
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', $request->input('email'))->first();

            if (! $user || ! Hash::check($request->input('password'), $user->password)) {
                return null;
            }

            // Allow admins regardless of member status
            if ($user->isAdmin()) {
                return $user;
            }

            // For regular users, block login if their member record is inactive
            $member = $user->member;
            if ($member && $member->inactive) {
                throw ValidationException::withMessages([
                    Fortify::username() => 'Your account is deactivated. Please talk to the admin if you want to activate your account.',
                ]);
            }

            return $user;
        });
    }

    /**
     * Configure login redirects based on user role.
     */
    private function configureLoginRedirects(): void
    {
        // After successful login, redirect based on user role
        Fortify::redirects('login', function (Request $request) {
            /** @var User */
            $user = Auth::user();

            if (!$user) {
                return route('login');
            }

            // Check if user is admin
            if ($user->isAdmin()) {
                return route('dashboard');
            }

            // Regular member redirect
            return route('member.home');
        });

        // Handle home page redirects
        Fortify::redirects('home', function () {
            /** @var User */
            $user = Auth::user();

            if (!$user) {
                return route('login');
            }

            if ($user->isAdmin()) {
                return route('dashboard');
            }

            return route('member.home');
        });
    }
}
