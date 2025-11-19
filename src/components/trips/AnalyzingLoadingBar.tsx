import { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';

export function AnalyzingLoadingBar() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Analyzing activities...');

  useEffect(() => {
    const stages = [
      'Analyzing activities...',
      'Checking weather conditions...',
      'Reviewing outfits...',
      'Generating recommendations...',
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Update stage
        const stageIndex = Math.floor(newProgress / 25);
        if (stageIndex !== currentStage && stageIndex < stages.length) {
          currentStage = stageIndex;
          setStage(stages[stageIndex]);
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <Plane className="w-6 h-6 text-purple-600 animate-bounce" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Loading Vacation Recommendations</h3>
          <p className="text-sm text-gray-600">{stage}</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
