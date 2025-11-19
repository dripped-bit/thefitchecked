import React, { useState, useEffect } from 'react';
import { directKlingAvatarService } from '../services/directKlingAvatarService';

const GlobalDemoModeToggle: React.FC = () => {
  const [demoMode, setDemoMode] = useState(() =>
    directKlingAvatarService.getDemoModeStatus().enabled
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newMode = directKlingAvatarService.toggleDemoMode();
    setDemoMode(newMode);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 transition-all duration-300 ${
          demoMode ? 'border-amber-400' : 'border-gray-300'
        } ${isExpanded ? 'px-4 py-3' : 'p-2'}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-3">
          {/* Always visible demo mode indicator */}
          <div className={`w-3 h-3 rounded-full ${demoMode ? 'bg-amber-500' : 'bg-gray-400'}`} />

          {/* Expandable content */}
          <div className={`transition-all duration-300 overflow-hidden ${
            isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
          }`}>
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-sm font-medium text-gray-700">Demo Mode</span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  demoMode ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    demoMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              {demoMode && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  DEMO
                </span>
              )}
            </div>
          </div>

          {/* Collapsed state hint */}
          {!isExpanded && (
            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {demoMode ? '🎭' : '⚡'}
            </div>
          )}
        </div>

        {/* Tooltip hint */}
        {!isExpanded && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Hover to toggle
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalDemoModeToggle;