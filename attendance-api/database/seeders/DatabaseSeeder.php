<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Test Teacher',
            'email' => 'testteacher@example.com',
            'password' => Hash::make('password'), // Use a secure password
            'user_type' => 'teacher', // Assuming there is an 'is_admin' column in the users table
            'registration_number' => '117320'
        ]);
        User::create([
            'name' => 'Test Student',
            'email' => 'teststudent@example.com',
            'password' => Hash::make('password'), // Use a secure password
            'user_type' => 'student', // Assuming there is an 'is_admin' column in the users table
            'registration_number' => '117321'
        ]);
    }
}
