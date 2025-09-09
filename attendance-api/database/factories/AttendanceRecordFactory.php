<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AttendanceRecord>
 */
class AttendanceRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $session = \App\Models\AttendanceSession::factory()->create();
        $markedAt = fake()->dateTimeBetween($session->started_at, $session->ended_at ?? 'now');

        return [
            'session_id' => $session->id,
            'student_id' => \App\Models\User::factory()->student(),
            'marked_at' => $markedAt,
            'token_used' => $session->current_token,
        ];
    }
}
