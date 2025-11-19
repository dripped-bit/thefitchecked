import { ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import type { MissingItemCategory } from '../../services/tripInsightsService';

interface MissingItemsSectionProps {
  items: MissingItemCategory[];
  onShopCategory: (category: string) => void;
}

export function MissingItemsSection({ items, onShopCategory }: MissingItemsSectionProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">All Set!</h3>
        </div>
        <p className="text-gray-600">You have everything you need for this trip.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Missing Items</h3>
      </div>

      <div className="space-y-3">
        {items.map((category, index) => (
          <div key={index}>
            <p className="text-sm text-gray-600 mb-2">{category.reason}</p>
            <button
              onClick={() => onShopCategory(category.category)}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-between transition-colors"
            >
              <span>{category.label}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
