<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class QRController extends Controller
{
    /**
     * Generate QR code data for an active session.
     */
    public function generateQRData(string $sessionId): JsonResponse
    {
        $session = AttendanceSession::with('schoolClass')->find($sessionId);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        if (!$session->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session is not active'
            ], 400);
        }

        // Generate new token if needed
        $token = $session->current_token;
        if (!$token) {
            $token = $session->generateNewToken();
        }

        $qrData = [
            'sessionId' => $session->session_id,
            'token' => $token,
            'timestamp' => now()->timestamp,
            'classId' => $session->class_id,
            'className' => $session->schoolClass->name
        ];

        return response()->json([
            'success' => true,
            'data' => $qrData,
            'qr_string' => json_encode($qrData)
        ]);
    }

    /**
     * Refresh QR token for a session.
     */
    public function refreshToken(string $sessionId): JsonResponse
    {
        $session = AttendanceSession::find($sessionId);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        if (!$session->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session is not active'
            ], 400);
        }

        $newToken = $session->generateNewToken();

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'token' => $newToken,
                'timestamp' => now()->timestamp
            ]
        ]);
    }

    /**
     * Validate QR code data.
     */
    public function validateQRData(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sessionId' => 'required|string',
                'token' => 'required|string',
                'timestamp' => 'required|integer'
            ]);

            // Find session by session_id
            $session = AttendanceSession::where('session_id', $validated['sessionId'])->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid session ID'
                ], 400);
            }

            if (!$session->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session is not active'
                ], 400);
            }

            // Check token validity
            if ($session->current_token !== $validated['token']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired token'
                ], 400);
            }

            // Check timestamp (QR code should be recent)
            $qrAge = now()->timestamp - $validated['timestamp'];
            $maxAge = $session->qr_refresh_interval; // seconds

            if ($qrAge > $maxAge) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code has expired'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'QR code is valid',
                'data' => [
                    'session' => $session->load('schoolClass'),
                    'age_seconds' => $qrAge
                ]
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
     * Get QR code settings for a session.
     */
    public function getQRSettings(string $sessionId): JsonResponse
    {
        $session = AttendanceSession::find($sessionId);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance session not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'refresh_interval' => $session->qr_refresh_interval,
                'current_token' => $session->current_token,
                'is_active' => $session->is_active,
                'session_id' => $session->session_id
            ]
        ]);
    }
}
