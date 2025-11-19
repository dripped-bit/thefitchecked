import { Lightbulb } from 'lucide-react';
import type { PackingInsight } from '../../services/tripInsightsService';

interface PackingInsightsSectionProps {
  insights: PackingInsight[];
}

export function PackingInsightsSection({ insights }: PackingInsightsSectionProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">Packing Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              insight.type === 'warning'
                ? 'bg-orange-50 border-orange-200'
                : insight.type === 'confirmation'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{insight.message}</p>
                {insight.details && (
                  <p className="text-sm text-gray-600 mt-1">{insight.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
