import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true
}: ProgressBarProps) {
  // Clamp progress to 0-100 range
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-white text-sm font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-white text-sm font-semibold">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Progress bar fill */}
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedProgress}%`,
            background: '#FF69B4', // Hot pink
            boxShadow: '0 0 10px rgba(255, 105, 180, 0.5)',
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
