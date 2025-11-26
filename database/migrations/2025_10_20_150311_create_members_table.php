<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('plan');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('notes')->nullable();
            $table->boolean('inactive')->default(false);
            $table->integer('renewals')->default(0);
            $table->timestamps();

            $table->index(['end_date', 'inactive']);
            $table->index('plan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
