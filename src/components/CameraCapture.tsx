/**
 * Camera Capture Component
 * Provides webcam access for desktop users to take photos directly
 * Uses MediaDevices API for live camera preview and capture
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Start camera when component mounts
  useEffect(() => {
    startCamera();

    // Cleanup: stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      console.log('📷 [CAMERA] Requesting camera access...');
      setError(null);
      setIsCameraReady(false);

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
          console.log('✅ [CAMERA] Camera ready');
        };
      }
    } catch (err) {
      console.error('❌ [CAMERA] Failed to access camera:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera. Please check permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      console.log('🛑 [CAMERA] Camera stopped');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ [CAMERA] Video or canvas element not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob then to File
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          console.log('✅ [CAMERA] Photo captured:', file.name);
          stopCamera();
          onCapture(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Take Photo
          </h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Camera Preview */}
        <div className="relative bg-black">
          {error ? (
            <div className="flex items-center justify-center min-h-[400px] p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-white text-lg mb-2">Camera Access Failed</p>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[600px] object-contain"
              />

              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Starting camera...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50 flex items-center justify-center space-x-4">
          <button
            onClick={switchCamera}
            disabled={!isCameraReady}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch Camera</span>
          </button>

          <button
            onClick={capturePhoto}
            disabled={!isCameraReady}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none font-semibold"
          >
            <Camera className="w-5 h-5" />
            <span>Capture Photo</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
