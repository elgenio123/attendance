import React, { useState, useEffect } from 'react';
import { QRScanner } from './QRScanner';
import { CheckCircle, XCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { attendanceService, AttendanceRecord } from '../services/attendanceService';

interface SubmissionResult {
  success: boolean;
  message: string;
  timestamp?: Date;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load today's attendance records
  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const loadTodayAttendance = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const records = await attendanceService.getAttendanceRecords(undefined, user.id);
      console.log(records.data)
      setTodayAttendance(records.data);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Parse QR code data
      const parsedData = JSON.parse(qrData);
      const { session_id, token, timestamp } = parsedData;

      // Validate QR code age (should be recent)
      const qrAge = Date.now() - timestamp;
      if (qrAge > 30000) { // 30 seconds
        throw new Error('QR code has expired. Please scan a fresh code.');
      }

      // Check if already submitted to this session
      const alreadySubmitted = todayAttendance.some(record => record.session_id === session_id);
      if (alreadySubmitted) {
        throw new Error('You have already marked attendance for this session.');
      }

      // Submit attendance to API
      const newRecord = await attendanceService.markAttendance({
        session_id,
        token_used: token
      });

      // Reload today's attendance
      await loadTodayAttendance();
      
      setSubmissionResult({
        success: true,
        message: 'Attendance marked successfully!',
        timestamp: new Date()
      });

    } catch (error: any) {
      let errorMessage = 'Failed to submit attendance. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('expired')) {
        errorMessage = 'QR code has expired. Please scan a fresh code.';
      } else if (error.message.includes('already')) {
        errorMessage = 'You have already marked attendance for this session.';
      } else if (error instanceof SyntaxError) {
        errorMessage = 'Invalid QR code. Please scan the correct attendance QR code.';
      }

      setSubmissionResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Scan QR codes to mark your attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Scanner Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Scan Attendance QR Code</h2>
          
          <QRScanner onScan={handleQRScan} isSubmitting={isSubmitting} />

          {submissionResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              submissionResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {submissionResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  submissionResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {submissionResult.message}
                </span>
              </div>
              {submissionResult.timestamp && (
                <p className="text-sm text-green-700 mt-1">
                  Time: {format(submissionResult.timestamp, 'HH:mm:ss')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Attendance</h2>
          
          <div className="space-y-4">
            {todayAttendance.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No attendance records for today</p>
              </div>
            ) : (
              todayAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{record.attendance_session?.school_class?.name || 'Unknown Class'}</p>
                      <p className="text-sm text-gray-600">Session: {record.attendance_session?.session_id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700 font-medium">
                      {format(new Date(record.marked_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-2">How to Mark Attendance</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ask your teacher to display the QR code for the session</li>
              <li>• Click "Start Scanning" and allow camera access</li>
              <li>• Point your camera at the QR code until it's recognized</li>
              <li>• Wait for confirmation that your attendance is marked</li>
              <li>• You can only mark attendance once per session</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="font-semibold text-gray-900">{user?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Registration:</p>
            <p className="font-semibold text-gray-900">{user?.registration_number || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};