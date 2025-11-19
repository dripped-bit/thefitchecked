import { CheckCircle, Circle } from 'lucide-react';
import type { ChecklistItem } from '../../hooks/useTrips';

interface ChecklistSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: ChecklistItem[];
  onToggle: (itemId: string, currentlyChecked: boolean) => void;
}

export function ChecklistSection({ title, icon, items, onToggle }: ChecklistSectionProps) {
  if (items.length === 0) return null;

  const checkedCount = items.filter(item => item.is_checked).length;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
          </div>
          <span className="text-sm text-gray-600">
            {checkedCount}/{items.length} checked
          </span>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="divide-y divide-gray-100">
        {items.map(item => (
          <div
            key={item.id}
            className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              item.is_checked ? 'bg-green-50/30' : ''
            }`}
          >
            <button
              onClick={() => onToggle(item.id, item.is_checked)}
              className="flex-shrink-0"
              aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
            >
              {item.is_checked ? (
                <CheckCircle className="w-6 h-6 text-green-600 fill-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div
                className={`font-medium ${
                  item.is_checked ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {item.item_name}
                {item.item_count > 1 && (
                  <span className="text-gray-500 ml-2">({item.item_count})</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
