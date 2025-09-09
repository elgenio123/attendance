<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];
        $subject = fake()->randomElement($subjects);

        return [
            'name' => $subject . ' ' . fake()->numberBetween(101, 999),
            'subject' => $subject,
            'total_students' => fake()->numberBetween(15, 35),
            'teacher_id' => \App\Models\User::factory()->teacher(),
        ];
    }
}
