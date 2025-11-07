import api from './api';

export interface AttendanceSession {
  id: number;
  session_id: string;
  class_id: number;
  teacher_id: number;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
  current_token?: string;
  qr_refresh_interval: number;
  school_class?: {
    id: number;
    name: string;
    subject: string;
    total_students?: number;
  };
  teacher?: {
    id: number;
    name: string;
  };
  attendanceRecords?: AttendanceRecord[];
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  marked_at: string;
  token_used?: string;
  attendance_session?: AttendanceSession;
  student?: {
    id: number;
    name: string;
    registration_number: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  class_id: number;
  teacher_id: number;
  qr_refresh_interval?: number;
}

export interface CreateAttendanceRecordRequest {
  session_id: number;
  token_used: string;
}

export interface SessionStats {
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_percentage: number;
}

export const attendanceService = {
  // Session management
  async getSessions(classId?: number, teacherId?: number): Promise<AttendanceSession[]> {
    const params: any = {};
    if (classId) params.class_id = classId;
    if (teacherId) params.teacher_id = teacherId;
    const response = await api.get('/attendance-sessions', { params });
    return response.data.data || response.data;
  },

  async getSessionById(id: number): Promise<AttendanceSession> {
    const response = await api.get(`/attendance-sessions/${id}`);
    return response.data.data || response.data;
  },

  async createSession(sessionData: CreateSessionRequest): Promise<AttendanceSession> {
    console.log(sessionData);
    const response = await api.post('/attendance-sessions', sessionData);
    return response.data;
  },

  async endSession(id: number): Promise<AttendanceSession> {
    const response = await api.post(`/attendance-sessions/${id}/end`);
    return response.data;
  },

  // Attendance records
  async getAttendanceRecords(sessionId?: number, studentId?: number): Promise<AttendanceRecord[]> {
    const params: any = {};
    if (sessionId) params.session_id = sessionId;
    if (studentId) params.student_id = studentId;
    
    const response = await api.get('/attendance-records', { params });
    return response.data.data || response.data;
  },

  async markAttendance(recordData: CreateAttendanceRecordRequest): Promise<AttendanceRecord> {
    const response = await api.post('/attendance-records', recordData);
    return response.data;
  },

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    const response = await api.get(`/attendance-records/session/${sessionId}/stats`);
    return response.data.data?.statistics || response.data.statistics || response.data;
  },

  // QR Code management
  async generateQRData(sessionId: number): Promise<{ qr_data: string; token: string; expires_at: string }> {
    const response = await api.get(`/qr/session/${sessionId}/data`);
    return response.data;
  },

  async refreshToken(sessionId: number): Promise<{ token: string; expires_at: string }> {
    const response = await api.post(`/qr/session/${sessionId}/refresh`);
    return response.data;
  },

  async validateQRData(qrData: string): Promise<{ valid: boolean; session_id?: number; message?: string }> {
    const response = await api.post('/qr/validate', { qr_data: qrData });
    return response.data;
  },

  async getQRSettings(sessionId: number): Promise<{ refresh_interval: number; current_token?: string }> {
    const response = await api.get(`/qr/session/${sessionId}/settings`);
    return response.data;
  },
};
