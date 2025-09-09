<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AttendanceSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'class_id',
        'teacher_id',
        'started_at',
        'ended_at',
        'is_active',
        'current_token',
        'qr_refresh_interval',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the class for this attendance session.
     */
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Get the teacher who created this session.
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the attendance records for this session.
     */
    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id');
    }

    /**
     * Generate a new QR token for this session.
     */
    public function generateNewToken()
    {
        $this->current_token = bin2hex(random_bytes(16));
        $this->save();
        return $this->current_token;
    }

    /**
     * End the attendance session.
     */
    public function endSession()
    {
        $this->is_active = false;
        $this->ended_at = now();
        $this->save();
    }
}
