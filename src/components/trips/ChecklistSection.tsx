import type { PackingCategory } from '../../constants/tripTypes';

export interface ChecklistItem {
  name: string;
  category: PackingCategory;
  quantity: number;
  isEssential: boolean;
  checked: boolean;
}

interface ChecklistSectionProps {
  title: string;
  emoji: string;
  items: ChecklistItem[];
  onToggle: (index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
}

export function ChecklistSection({ 
  title, 
  emoji, 
  items, 
  onToggle, 
  onQuantityChange 
}: ChecklistSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <div key={index} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(index)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={item.checked ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {item.name}
              </span>
              {item.isEssential && (
                <span className="ml-2 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                  Essential
                </span>
              )}
            </div>
            {item.quantity > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">×</span>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={!item.checked}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
