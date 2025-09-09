<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create teachers
        $teachers = \App\Models\User::factory()->teacher()->count(5)->create();

        // Create students
        $students = \App\Models\User::factory()->student()->count(50)->create();

        // Create classes for each teacher
        $classes = collect();
        foreach ($teachers as $teacher) {
            $teacherClasses = \App\Models\SchoolClass::factory()
                ->count(3)
                ->create(['teacher_id' => $teacher->id]);
            $classes = $classes->merge($teacherClasses);
        }

        // Create attendance sessions for each class
        $sessions = collect();
        foreach ($classes as $class) {
            $classSessions = \App\Models\AttendanceSession::factory()
                ->count(5)
                ->create([
                    'class_id' => $class->id,
                    'teacher_id' => $class->teacher_id
                ]);
            $sessions = $sessions->merge($classSessions);
        }

        // Create attendance records for some sessions
        foreach ($sessions as $session) {
            if (!$session->is_active) {
                // Create random attendance records for completed sessions
                $numRecords = rand(5, min($session->schoolClass->total_students, 25));
                $selectedStudents = $students->random($numRecords);

                foreach ($selectedStudents as $student) {
                    \App\Models\AttendanceRecord::factory()->create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'marked_at' => fake()->dateTimeBetween($session->started_at, $session->ended_at),
                        'token_used' => $session->current_token,
                    ]);
                }
            }
        }
    }
}
