import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  isLoading?: boolean;
  message?: string;
  onLoadingComplete?: () => void;
  autoCompleteAfter?: number; // milliseconds
}

export function LoadingScreen({ isLoading = true, message, onLoadingComplete, autoCompleteAfter = 9000 }: LoadingScreenProps) {
  const [show, setShow] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setFadeOut(false);

      // Auto-complete after specified duration (default 9 seconds for MP4 animation)
      if (onLoadingComplete && autoCompleteAfter > 0) {
        console.log(`⏱️ [LOADING-SCREEN] Auto-complete timer started: ${autoCompleteAfter}ms`);
        const timer = setTimeout(() => {
          console.log('✅ [LOADING-SCREEN] Loading complete, triggering callback...');
          onLoadingComplete();
        }, autoCompleteAfter);

        return () => {
          console.log('🧹 [LOADING-SCREEN] Cleaning up auto-complete timer');
          clearTimeout(timer);
        };
      }
    } else {
      setFadeOut(true);
      setTimeout(() => setShow(false), 500);
    }
  }, [isLoading, onLoadingComplete, autoCompleteAfter]);

  if (!show) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="loading-content">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="loading-video"
        >
          <source src="/loading-animation.mp4" type="video/mp4" />
        </video>
        {message && (
          <div className="loading-message">
            <p className="text-white text-lg font-medium mt-4">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;