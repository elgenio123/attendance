<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AttendanceSessionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceSession::with(['schoolClass', 'teacher', 'attendanceRecords.student']);

        // Filter by class if provided
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        // Filter by teacher if provided
        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $sessions = $query->orderBy('started_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'class_id' => 'required|exists:classes,id',
                'teacher_id' => 'required|exists:users,id',
                'qr_refresh_interval' => 'sometimes|integer|min:15|max:30'
            ]);

            // Generate unique session ID
            $sessionId = 'session_' . uniqid();

            $session = AttendanceSession::create([
                'session_id' => $sessionId,
                'class_id' => $validated['class_id'],
                'teacher_id' => $validated['teacher_id'],
                'started_at' => now(),
                'is_active' => true,
                'qr_refresh_interval' => $validated['qr_refresh_interval'] ?? 20,
                'current_token' => bin2hex(random_bytes(16))
            ]);

            $session->load(['schoolClass', 'teacher']);

            return response()->json([
                'success' => true,
                'message' => 'Attendance session started successfully',
                'data' => $session
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
        $session = AttendanceSession::with([
            'schoolClass',
            'teacher',
            'attendanceRecords.student'
        ])->find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $session = AttendanceSession::find($id);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance session not found'
                ], 404);
            }

            $validated = $request->validate([
                'qr_refresh_interval' => 'sometimes|integer|min:15|max:30',
                'is_active' => 'sometimes|boolean'
            ]);

            $session->update($validated);
            $session->load(['schoolClass', 'teacher']);

            return response()->json([
                'success' => true,
                'message' => 'Attendance session updated successfully',
                'data' => $session
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
        $session = AttendanceSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance session deleted successfully'
        ]);
    }

    /**
     * End an active attendance session.
     */
    public function endSession(string $id): JsonResponse
    {
        $session = AttendanceSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        if (!$session->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Session is already ended'
            ], 400);
        }

        $session->endSession();
        $session->load(['schoolClass', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Attendance session ended successfully',
            'data' => $session
        ]);
    }
}
