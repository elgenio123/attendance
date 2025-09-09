<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AttendanceSession>
 */
class AttendanceSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-7 days', 'now');
        $isActive = fake()->boolean(30); // 30% chance of being active

        return [
            'session_id' => 'session_' . fake()->unique()->regexify('[A-Z0-9]{8}'),
            'class_id' => \App\Models\SchoolClass::factory(),
            'teacher_id' => \App\Models\User::factory()->teacher(),
            'started_at' => $startedAt,
            'ended_at' => $isActive ? null : fake()->dateTimeBetween($startedAt, 'now'),
            'is_active' => $isActive,
            'current_token' => $isActive ? bin2hex(random_bytes(16)) : null,
            'qr_refresh_interval' => fake()->numberBetween(15, 30),
        ];
    }
}
