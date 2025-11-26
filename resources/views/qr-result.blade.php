<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $success ? 'Success' : 'Error' }} - Fitness Point</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 text-gray-200">
    <div class="max-w-md w-full bg-slate-900/80 border border-gray-700 rounded-2xl p-8 text-center shadow-2xl">
        <!-- Success/Error Icon -->
        <div class="mb-6">
            @if($success)
                <div class="mx-auto w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            @else
                <div class="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
            @endif
        </div>

        <!-- Gym Name -->
        <h1 class="text-2xl font-bold text-white mb-2">Fitness Point</h1>

        <!-- User Name -->
        @if($user)
            <p class="text-gray-400 mb-4">{{ $user['name'] }}</p>
        @endif

        <!-- Message -->
        <p class="text-lg {{ $success ? 'text-green-300' : 'text-red-300' }} mb-6">
            {{ $message }}
        </p>

        @if($success && isset($action))
            <!-- Action Details -->
            <div class="bg-slate-800/50 border border-gray-700 rounded-lg p-4 mb-6 text-left">
                @if($action === 'time_in')
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Time In:</span>
                        <span class="font-mono text-white">{{ $session['time_in'] }}</span>
                    </div>
                @else
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Time Out:</span>
                            <span class="font-mono text-white">{{ $session['time_out'] }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Duration:</span>
                            <span class="font-mono text-blue-300">{{ $session['duration'] }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Credits Used:</span>
                            <span class="font-mono text-amber-300">₱{{ number_format($session['credits_used'], 2) }}</span>
                        </div>
                    </div>
                @endif
            </div>
        @endif

        @if($user)
            <!-- Current Balance -->
            <div class="bg-slate-800/50 border border-gray-700 rounded-lg p-4 mb-6">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">Current Balance:</span>
                    <span class="font-mono text-lg font-bold {{ $user['balance'] && str_replace(['₱', ','], '', $user['balance']) >= 27 ? 'text-green-400' : 'text-amber-400' }}">
                        {{ $user['balance'] }}
                    </span>
                </div>
            </div>
        @endif

        <!-- Auto-refresh message -->
        <p class="text-sm text-gray-500">
            This page will automatically close in <span id="countdown">5</span> seconds.
        </p>
    </div>

    <script>
        // Auto-close the page after 5 seconds
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');

        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(timer);
                window.close();
                // If window.close() doesn't work (some browsers block it), redirect to a blank page
                setTimeout(() => {
                    document.body.innerHTML = '<div class="min-h-screen flex items-center justify-center text-gray-400"><p>You can now close this page.</p></div>';
                }, 100);
            }
        }, 1000);
    </script>
</body>
</html>
