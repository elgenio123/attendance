import React, { useState, useEffect } from 'react';
import { Calendar, Download, Search, Users, Clock, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { classService } from '../services/classService';

interface AttendanceSession {
  id: string;
  date: Date;
  className: string;
  duration: number;
  studentsPresent: number;
  totalStudents: number;
  students: Array<{
    id: string;
    name: string;
    registrationNumber: string;
    timestamp: Date;
  }>;
}

export const AttendanceReports: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('week');
  const [classNames, setClassNames] = useState([]);

  const loadClassNames = async () => {
        const classesData = await classService.getAll();
        const data = Array.isArray(classesData) ? classesData : (classesData?.data ?? []);
        console.log(data[0])
        const l = Array<string>()
        for (let i = 0; i < data.length; i++){
            l.push(data[i]?.subject)
        }
        console.log(l)
        setClassNames(l)
      };
    
  // Mock data generation
  useEffect(() => {
    loadClassNames()
    const mockSessions: AttendanceSession[] = [];
    
    const studentNames = [
      'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown',
      'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen', 'Jack Robinson'
    ];

    for (let i = 0; i < 15; i++) {
      const date = subDays(new Date(), i);
      const className = classNames[Math.floor(Math.random() * classNames.length)];
      const studentsPresent = Math.floor(Math.random() * 8) + 3; // 3-10 students
      const totalStudents = 10;

      const students = [];
      for (let j = 0; j < studentsPresent; j++) {
        students.push({
          id: `${i}-${j}`,
          name: studentNames[j],
          registrationNumber: `STU00${j + 1}`,
          timestamp: new Date(date.getTime() + Math.random() * 3600000) // Random time during class
        });
      }

      mockSessions.push({
        id: `session_${i}`,
        date,
        className,
        duration: 50 + Math.floor(Math.random() * 40), // 50-90 minutes
        studentsPresent,
        totalStudents,
        students
      });
    }

    setSessions(mockSessions);
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session?.className?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    let withinDateRange = true;
    
    if (dateFilter === 'today') {
      withinDateRange = session.date.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      withinDateRange = session.date >= subDays(now, 7);
    } else if (dateFilter === 'month') {
      withinDateRange = session.date >= subDays(now, 30);
    }
    
    return matchesSearch && withinDateRange;
  });

  const exportSessionCSV = (session: AttendanceSession) => {
    const csvContent = [
      ['Session Details'],
      ['Class', session.className],
      ['Date', format(session.date, 'yyyy-MM-dd')],
      ['Duration', `${session.duration} minutes`],
      ['Students Present', `${session.studentsPresent}/${session.totalStudents}`],
      [''],
      ['Student Name', 'Registration Number', 'Timestamp'],
      ...session.students.map(student => [
        student.name,
        student.registrationNumber,
        format(student.timestamp, 'yyyy-MM-dd HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${session.className}_${format(session.date, 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllCSV = () => {
    const allStudentRecords = filteredSessions.flatMap(session =>
      session.students.map(student => [
        session.className,
        format(session.date, 'yyyy-MM-dd'),
        student.name,
        student.registrationNumber,
        format(student.timestamp, 'yyyy-MM-dd HH:mm:ss')
      ])
    );

    const csvContent = [
      ['Class', 'Date', 'Student Name', 'Registration Number', 'Timestamp'],
      ...allStudentRecords
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Reports</h1>
            <p className="text-gray-600">View and export attendance records</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={exportAllCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Classes
            </label>
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                id="search"
                placeholder="Search by class name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Session History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredSessions.length} sessions found
            </p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                      selectedSession?.id === session.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{session.className}</h3>
                        <p className="text-sm text-gray-600">
                          {format(session.date, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{session.studentsPresent}/{session.totalStudents}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>{session.duration}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white rounded-lg shadow">
          {selectedSession ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedSession.className}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {format(selectedSession.date, 'EEEE, MMMM dd, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => exportSessionCSV(selectedSession)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedSession.studentsPresent}
                    </p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">
                      {selectedSession.totalStudents - selectedSession.studentsPresent}
                    </p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((selectedSession.studentsPresent / selectedSession.totalStudents) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Rate</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Students Present</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedSession.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-700 font-medium">
                          {format(student.timestamp, 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Select a session to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};