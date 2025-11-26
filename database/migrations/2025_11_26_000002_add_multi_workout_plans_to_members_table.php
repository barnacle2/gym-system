<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->json('workout_plans')->nullable()->after('workout_plan');
            $table->unsignedTinyInteger('active_workout_plan')->nullable()->after('workout_plans');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['workout_plans', 'active_workout_plan']);
        });
    }
};
