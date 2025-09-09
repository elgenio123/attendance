<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'student_id',
        'marked_at',
        'token_used',
    ];

    protected $casts = [
        'marked_at' => 'datetime',
    ];

    /**
     * Get the attendance session for this record.
     */
    public function attendanceSession()
    {
        return $this->belongsTo(AttendanceSession::class, 'session_id');
    }

    /**
     * Get the student who marked attendance.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
