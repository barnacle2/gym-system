<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@fitness.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_admin' => true,
        ]);

        // Create member users
        $memberUsers = [
            [
                'name' => 'Alex Johnson',
                'email' => 'alex@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ],
            [
                'name' => 'Priya Singh',
                'email' => 'priya@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ],
            [
                'name' => 'Liam Chen',
                'email' => 'liam@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ],
            [
                'name' => 'Sara Martinez',
                'email' => 'sara@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ],
        ];

        foreach ($memberUsers as $userData) {
            User::create($userData);
        }
    }
}
