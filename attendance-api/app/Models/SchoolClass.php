<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'name',
        'subject',
        'total_students',
        'teacher_id',
    ];

    /**
     * Get the teacher who teaches this class.
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the attendance sessions for this class.
     */
    public function attendanceSessions()
    {
        return $this->hasMany(AttendanceSession::class, 'class_id');
    }
}
