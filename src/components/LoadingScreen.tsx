import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';
import { ProgressBar } from './ProgressBar';

interface LoadingScreenProps {
  isLoading?: boolean;
  isOpen?: boolean; // Alternative to isLoading (for modal usage)
  message?: string;
  onLoadingComplete?: () => void;
  onCancel?: () => void; // Optional cancel callback
  autoCompleteAfter?: number; // milliseconds
  type?: 'spinner' | 'progress'; // Type of loading indicator
  progress?: number; // 0-100 for progress bar mode
}

export function LoadingScreen({
  isLoading,
  isOpen,
  message,
  onLoadingComplete,
  onCancel,
  autoCompleteAfter = 5100,
  type = 'spinner',
  progress = 0
}: LoadingScreenProps) {
  // Support both isLoading and isOpen props
  const active = isOpen ?? isLoading ?? true;
  const [show, setShow] = useState(active);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      setFadeOut(false);

      // Auto-complete after specified duration (default 5.1 seconds to match MP4 animation)
      // Only auto-complete if no cancel button (onCancel not provided)
      if (onLoadingComplete && autoCompleteAfter > 0 && !onCancel) {
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
  }, [active, onLoadingComplete, onCancel, autoCompleteAfter]);

  if (!show) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="loading-content">
        {/* Conditional rendering: spinner or progress bar */}
        {type === 'progress' ? (
          <div className="w-full px-8">
            <ProgressBar
              progress={progress}
              label={message}
              showPercentage={true}
            />
          </div>
        ) : (
          <>
            <div className="loading-spinner">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  stroke="#FF69B4"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="120 40"
                  className="spinner-circle"
                />
              </svg>
            </div>
            {message && (
              <div className="loading-message">
                <p className="text-white text-lg font-medium mt-4">{message}</p>
              </div>
            )}
          </>
        )}

        {/* Cancel Button - Only show if onCancel is provided */}
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 32px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '24px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10002,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;