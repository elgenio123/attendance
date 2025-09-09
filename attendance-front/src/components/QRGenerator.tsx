import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Clock, RefreshCw } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';

interface QRGeneratorProps {
  sessionId: number;
  onTokenChange?: (token: string) => void;
  refreshInterval?: number; // in seconds, default 15
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ sessionId, onTokenChange, refreshInterval = 15 }) => {
  const [currentToken, setCurrentToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateNewToken = async () => {
    setIsRefreshing(true);
    try {
      const response = await attendanceService.refreshToken(sessionId);
      setCurrentToken(response.token);
      setTimeLeft(refreshInterval);
      onTokenChange?.(response.token);
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!sessionId || sessionId <= 0) return;
      try {
        const data = await attendanceService.generateQRData(sessionId);
        if (!mounted) return;
        setCurrentToken(data.token);
        setTimeLeft(refreshInterval);
        onTokenChange?.(data.token);
      } catch (error) {
        console.error('Error generating QR data:', error);
      }
    };
    init();
    return () => { mounted = false; };
  }, [sessionId, refreshInterval, onTokenChange]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (sessionId && sessionId > 0) {
            generateNewToken();
          }
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, sessionId]);

  const qrData = JSON.stringify({
    session_id: sessionId,
    token: currentToken,
    timestamp: Date.now()
  });

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg border">
        <div className="relative">
          <QRCodeCanvas
            value={qrData}
            size={280}
            level="M"
            includeMargin={true}
            className={`transition-opacity duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
          />
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-lg font-semibold text-gray-700">
          <Clock className="h-5 w-5" />
          <span>Refreshes in {timeLeft}s</span>
        </div>
        <p className="text-sm text-gray-500">
          Students scan this QR code to mark attendance
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full max-w-sm">
        <p className="text-sm text-blue-800 text-center">
          Session ID: <span className="font-mono font-semibold">{sessionId}</span>
        </p>
      </div>
    </div>
  );
};
