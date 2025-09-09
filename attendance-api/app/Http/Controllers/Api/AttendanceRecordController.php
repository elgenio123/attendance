<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class AttendanceRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceRecord::with(['attendanceSession.schoolClass', 'student']);

        // Filter by session if provided
        if ($request->has('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        // Filter by student if provided
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        // Filter by date range if provided
        if ($request->has('date_from')) {
            $query->whereDate('marked_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('marked_at', '<=', $request->date_to);
        }

        $records = $query->orderBy('marked_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $records
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'session_id' => 'required|exists:attendance_sessions,id',
                'student_id' => 'required|exists:users,id',
                'token' => 'required|string'
            ]);

            // Find the session
            $session = AttendanceSession::find($validated['session_id']);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance session not found'
                ], 404);
            }

            // Check if session is active
            if (!$session->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance session is not active'
                ], 400);
            }

            // Validate token
            if ($session->current_token !== $validated['token']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired QR token'
                ], 400);
            }

            // Check if student already marked attendance for this session
            $existingRecord = AttendanceRecord::where('session_id', $validated['session_id'])
                ->where('student_id', $validated['student_id'])
                ->first();

            if ($existingRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already marked attendance for this session'
                ], 400);
            }

            // Create attendance record
            $record = AttendanceRecord::create([
                'session_id' => $validated['session_id'],
                'student_id' => $validated['student_id'],
                'marked_at' => now(),
                'token_used' => $validated['token']
            ]);

            $record->load(['attendanceSession.schoolClass', 'student']);

            return response()->json([
                'success' => true,
                'message' => 'Attendance marked successfully',
                'data' => $record
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $record = AttendanceRecord::with([
            'attendanceSession.schoolClass',
            'student'
        ])->find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $record
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $record = AttendanceRecord::find($id);

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance record not found'
                ], 404);
            }

            $validated = $request->validate([
                'marked_at' => 'sometimes|date'
            ]);

            $record->update($validated);
            $record->load(['attendanceSession.schoolClass', 'student']);

            return response()->json([
                'success' => true,
                'message' => 'Attendance record updated successfully',
                'data' => $record
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $record = AttendanceRecord::find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found'
            ], 404);
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted successfully'
        ]);
    }

    /**
     * Get attendance statistics for a session.
     */
    public function getSessionStats(string $sessionId): JsonResponse
    {
        $session = AttendanceSession::with(['schoolClass', 'attendanceRecords.student'])->find($sessionId);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        $totalStudents = $session->schoolClass->total_students;
        $presentCount = $session->attendanceRecords->count();
        $absentCount = $totalStudents - $presentCount;
        $attendanceRate = $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'session' => $session,
                'statistics' => [
                    'total_students' => $totalStudents,
                    'present_count' => $presentCount,
                    'absent_count' => $absentCount,
                    'attendance_rate' => $attendanceRate
                ]
            ]
        ]);
    }
}
