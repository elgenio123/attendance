<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\AttendanceSessionController;
use App\Http\Controllers\Api\AttendanceRecordController;
use App\Http\Controllers\Api\QRController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication Routes (Public)
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

// Protected Routes
Route::group(['middleware' => 'auth:api'], function () {
    // Auth Routes
    Route::group(['prefix' => 'auth'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('user-profile', [AuthController::class, 'userProfile']);
    });

    // Classes API Routes
    Route::apiResource('classes', ClassController::class);

    // Attendance Sessions API Routes
    Route::apiResource('attendance-sessions', AttendanceSessionController::class);
    Route::post('attendance-sessions/{id}/end', [AttendanceSessionController::class, 'endSession']);

    // Attendance Records API Routes
    Route::apiResource('attendance-records', AttendanceRecordController::class);
    Route::get('attendance-records/session/{sessionId}/stats', [AttendanceRecordController::class, 'getSessionStats']);

    // QR Code API Routes
    Route::prefix('qr')->group(function () {
        Route::get('session/{sessionId}/data', [QRController::class, 'generateQRData']);
        Route::post('session/{sessionId}/refresh', [QRController::class, 'refreshToken']);
        Route::post('validate', [QRController::class, 'validateQRData']);
        Route::get('session/{sessionId}/settings', [QRController::class, 'getQRSettings']);
    });
});
