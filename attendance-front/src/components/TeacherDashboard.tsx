import React, { useState, useEffect } from 'react';
import { QRGenerator } from './QRGenerator';
import { AttendanceReports } from './AttendanceReports';
import { Play, Square, Users, Clock, Download, Plus, BookOpen, Settings, BarChart3, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { classService, Class } from '../services/classService';
import { attendanceService, AttendanceSession, AttendanceRecord } from '../services/attendanceService';
import { useAuth } from '../contexts/AuthContext';

type DashboardView = 'overview' | 'reports' | 'classes';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentToken, setCurrentToken] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [qrRefreshInterval, setQrRefreshInterval] = useState(20); // Default 20 seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Poll for attendance records when session is active
  useEffect(() => {
    if (!isSessionActive || !currentSession) {
      // Clear records when session is not active
      setAttendanceRecords([]);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const records = await attendanceService.getAttendanceRecords(currentSession.id);
        setAttendanceRecords(Array.isArray(records) ? records : []);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isSessionActive, currentSession]);

  // Force re-render when session state changes
  useEffect(() => {
    console.log('Session state changed:', { isSessionActive, currentSession: currentSession?.session_id});
  }, [isSessionActive, currentSession]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const classesData = await classService.getAll();
      const list = Array.isArray(classesData) ? classesData : (classesData?.data ?? []);
      setClasses(list);
      if (list.length > 0) {
        setSelectedClass(list[0]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (className: string, subject: string, totalStudents: number) => {
    try {
      setLoading(true);
      const newClass = await classService.create({
        name: className,
        subject,
        total_students: totalStudents
      });
      setClasses(prev => [...prev, newClass]);
      setSelectedClass(newClass);
      setShowCreateClass(false);
    } catch (error: any) {
      setError(error.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    
    if (!selectedClass) {
      console.log('No class selected');
      return;
    }
    
    try {
      setLoading(true);
      const session = await attendanceService.createSession({
        class_id: selectedClass.id,
        teacher_id: user?.id,
        qr_refresh_interval: qrRefreshInterval,
        started_at: new Date()
      });
      console.log(session);
      setCurrentSession(session.data);
      setIsSessionActive(true);
      setAttendanceRecords([]);
      setCurrentToken(session.current_token || '');
      console.log(session);
    } catch (error: any) {
      console.log(error);
      setError(error.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!currentSession || !currentSession.id) {
      console.error('No active session to end');
      setError('No active session to end');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Ending session with ID:', currentSession.id);
      const response = await attendanceService.endSession(currentSession.id);
      console.log('Session ended successfully:', response);
      
      // Force state update
      setIsSessionActive(false);
      setCurrentSession(null);
      setCurrentToken('');
      setAttendanceRecords([]);
      
      // Clear any intervals
      if (window.sessionEndInterval) {
        clearInterval(window.sessionEndInterval);
      }
      
    } catch (error: any) {
      console.error('Error ending session:', error);
      setError(error.response?.data?.message || error.message || 'Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedClass || !currentSession) return;
    
    const csvContent = [
      ['Class Information'],
      ['Class Name', selectedClass.name],
      ['Subject', selectedClass.subject],
      ['Total Students', selectedClass.total_students.toString()],
      ['Session Date', format(new Date(currentSession.started_at), 'yyyy-MM-dd')],
      ['Session Start Time', format(new Date(currentSession.started_at), 'HH:mm:ss')],
      ['Students Present', attendanceRecords.length.toString()],
      [''],
      ['Student Attendance Records'],
      ['Student Name', 'Registration Number', 'Timestamp'],
      ...attendanceRecords.map(record => [
        record.student?.name || 'Unknown',
        record.student?.registration_number || 'N/A',
        format(new Date(record.marked_at), 'yyyy-MM-dd HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedClass.name.replace(/\s+/g, '_')}_attendance_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Class Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Class Management</h2>
          <button
            onClick={() => setShowCreateClass(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes?.map((cls) => (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedClass?.id === cls.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{cls.name}</p>
              <p className="text-sm text-gray-500">{cls.total_students} students</p>
            </div>
          ))}
        </div>

        {selectedClass && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Selected Class: {selectedClass.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Subject: {selectedClass.subject}</span>
              <span>Students: {selectedClass.total_students}</span>
              <span>Created: {selectedClass.created_at ? format(new Date(selectedClass.created_at), 'MMM dd, yyyy') : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code and Session Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Attendance Session</h2>
            <div className="flex space-x-2">
              {!isSessionActive ? (
                <button
                  onClick={startSession}
                  disabled={!selectedClass}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      console.log('End session button clicked');
                      console.log('Current session:', currentSession);
                      endSession();
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {loading ? 'Ending...' : 'End Session'}
                  </button>
                  {/*<button
                    onClick={() => {
                      console.log('Force refresh clicked');
                      setIsSessionActive(false);
                      setCurrentSession(null);
                      setCurrentToken('');
                      setAttendanceRecords([]);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    title="Force refresh if session doesn't end"
                  >
                    🔄
                  </button>*/}
                </div>
              )}
            </div>
          </div>

          {/* QR Settings */}
          {!isSessionActive && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">QR Code Refresh Interval</h3>
                  <p className="text-xs text-gray-600">How often the QR code refreshes (15-30 seconds)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="15"
                    max="30"
                    value={qrRefreshInterval}
                    onChange={(e) => setQrRefreshInterval(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm font-medium text-gray-700 w-8">{qrRefreshInterval}s</span>
                </div>
              </div>
            </div>
          )}

          {!selectedClass ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">Please select a class to start attendance session</p>
            </div>
          ) : isSessionActive ? (
            <div className="text-center">
              <QRGenerator 
                sessionId={currentSession?.id && currentSession.id > 0 ? currentSession.id : 0} 
                onTokenChange={setCurrentToken}
                refreshInterval={qrRefreshInterval}
              />
              {currentSession && (
                <div className="mt-4 text-sm text-gray-600">
                  {currentSession.started_at ? `Session started at ${format(new Date(currentSession.started_at), 'HH:mm:ss')}` : ''}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">Click "Start Session" to begin taking attendance</p>
            </div>
          )}
        </div>

        {/* Live Attendance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">Live Attendance</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {attendanceRecords.length} Present
              </span>
            </div>
            {attendanceRecords.length > 0 && (
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Waiting for students to scan...</p>
              </div>
            ) : (
              attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{record.student?.name || 'Unknown Student'}</p>
                    <p className="text-sm text-gray-600">{record.student?.registration_number || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700 font-medium">
                      {format(new Date(record.marked_at), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Session Stats */}
      {isSessionActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Present</p>
                <p className="text-2xl font-bold text-blue-900">{attendanceRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Session Duration</p>
                <p className="text-2xl font-bold text-green-900">
                  {currentSession ? Math.floor((Date.now() - new Date(currentSession.started_at).getTime()) / 60000) : 0}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Status</p>
                <p className="text-2xl font-bold text-purple-900">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreateClassModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Class</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          createClass(
            formData.get('className') as string,
            formData.get('subject') as string,
            parseInt(formData.get('totalStudents') as string)
          );
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
              <input
                type="text"
                name="className"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Students</label>
              <input
                type="number"
                name="totalStudents"
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowCreateClass(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage classes, attendance sessions, and track student participation</p>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentView('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentView('classes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === 'classes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Classes</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'reports' && <AttendanceReports />}
      {currentView === 'classes' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Classes</h2>
            <button
              onClick={() => setShowCreateClass(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">{cls.subject}</p>
                <p className="text-sm text-gray-500 mb-3">{cls.total_students} students</p>
                <p className="text-xs text-gray-400">Created: {format(new Date(cls.created_at), 'MMM dd, yyyy')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClass && renderCreateClassModal()}
    </div>
  );
};