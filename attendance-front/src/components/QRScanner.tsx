import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  isSubmitting?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, isSubmitting }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    const startCamera = async () => {
      try {
        const html5Qrcode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Get available cameras and prefer rear camera
        const cameras = await Html5Qrcode.getCameras();
        console.log('Available cameras:', cameras);
        
        // Look for rear camera first, fallback to any camera
        let cameraId = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        )?.id;
        
        // If no rear camera found, use the last camera (usually rear on mobile)
        if (!cameraId && cameras.length > 0) {
          cameraId = cameras[cameras.length - 1].id;
        }

        if (!cameraId) {
          setError('No camera found');
          return;
        }
        
        console.log('Using camera:', cameraId);

        await html5Qrcode.start(
          cameraId,
          config,
          (decodedText) => {
            setError(null);
            onScan(decodedText);
            stopScanning();
          },
          (error) => {
            // Ignore frequent scan errors
            if (!error.includes('NotFoundException')) {
              console.warn('QR scan error:', error);
            }
          }
        );
      } catch (err) {
        console.error('Error starting camera:', err);
        setError('Failed to access camera. Please check permissions and try again.');
      }
    };

    startCamera();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning, onScan]);

  const startScanning = async () => {
    setError(null);
    
    // Check camera permissions first
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setError('No cameras found on this device');
        return;
      }
      console.log('Available cameras:', devices);
    } catch (err) {
      console.error('Camera permission error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
      return;
    }

    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isScanning ? (
        <div className="text-center space-y-6">
          <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-8">
            <Camera className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Scan
            </h3>
            <p className="text-gray-600 mb-6">
              Click the button below to open your camera and scan the attendance QR code
            </p>
            <button
              onClick={() => startScanning()}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isSubmitting ? 'Submitting...' : 'Start Scanning'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scanning for QR Code
            </h3>
            <p className="text-gray-600 text-sm">
              Position the QR code within the frame
            </p>
          </div>
          
          <div 
            id="qr-reader" 
            className="rounded-lg overflow-hidden border-2 border-gray-200"
          />
          
          <button
            onClick={stopScanning}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Cancel Scanning
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
};