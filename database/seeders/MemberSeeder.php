<?php

namespace Database\Seeders;

use App\Enums\MembershipPlan;
use App\Models\Member;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MemberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get member users (non-admin users)
        $memberUsers = User::where('is_admin', false)->get();

        $memberData = [
            [
                'full_name' => 'Alex Johnson',
                'email' => 'alex@example.com',
                'phone' => '+1 555 1010',
                'plan' => MembershipPlan::MONTHLY,
                'start_date' => Carbon::parse('2024-09-20'),
                'end_date' => Carbon::parse('2024-10-20'),
                'notes' => 'AM workouts',
                'inactive' => false,
                'renewals' => 0,
            ],
            [
                'full_name' => 'Priya Singh',
                'email' => 'priya@example.com',
                'phone' => '+91 98765 43210',
                'plan' => MembershipPlan::ANNUAL,
                'start_date' => Carbon::parse('2024-07-20'),
                'end_date' => Carbon::parse('2025-07-20'),
                'notes' => 'Yoga + Cardio',
                'inactive' => false,
                'renewals' => 0,
            ],
            [
                'full_name' => 'Liam Chen',
                'email' => 'liam@example.com',
                'phone' => '+44 7700 900123',
                'plan' => MembershipPlan::QUARTERLY,
                'start_date' => Carbon::parse('2024-08-20'),
                'end_date' => Carbon::parse('2024-11-20'),
                'notes' => 'Student',
                'inactive' => false,
                'renewals' => 0,
            ],
            [
                'full_name' => 'Sara Martinez',
                'email' => 'sara@example.com',
                'phone' => '+34 600 123 456',
                'plan' => MembershipPlan::MONTHLY,
                'start_date' => Carbon::parse('2024-08-20'),
                'end_date' => Carbon::parse('2024-09-20'),
                'notes' => 'Needs invoice',
                'inactive' => false,
                'renewals' => 0,
            ],
        ];

        // Create members and link them to users
        foreach ($memberData as $index => $data) {
            if (isset($memberUsers[$index])) {
                $data['user_id'] = $memberUsers[$index]->id;
                Member::create($data);
            }
        }
    }
}
