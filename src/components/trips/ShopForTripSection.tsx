import { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingBag } from 'lucide-react';
import type { ClothingItem } from '../../hooks/useCloset';

interface ShopForTripSectionProps {
  clothesByCategory: Record<string, ClothingItem[]>;
}

const CATEGORY_ORDER = ['tops', 'bottoms', 'shoes', 'outerwear', 'sleepwear', 'underwear', 'socks', 'accessories', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  sleepwear: 'Sleepwear',
  underwear: 'Underwear',
  socks: 'Socks',
  accessories: 'Accessories',
  other: 'Other',
};

const CATEGORY_EMOJI: Record<string, string> = {
  tops: '👕',
  bottoms: '👖',
  shoes: '👟',
  outerwear: '🧥',
  sleepwear: '🌙',
  underwear: '🩲',
  socks: '🧦',
  accessories: '👜',
  other: '👔',
};

export function ShopForTripSection({ clothesByCategory }: ShopForTripSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const totalItems = Object.values(clothesByCategory).reduce((sum, items) => sum + items.length, 0);

  if (totalItems === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 text-center">
        <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-2">No Outfits Planned Yet</p>
        <p className="text-sm text-gray-500">
          Add activities with outfits in the PLAN tab to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Shop for Trip</h3>
        <span className="text-sm text-gray-600">({totalItems} items)</span>
      </div>

      <div className="space-y-3">
        {CATEGORY_ORDER.map(category => {
          const items = clothesByCategory[category];
          if (!items || items.length === 0) return null;

          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-xl">{CATEGORY_EMOJI[category] || '👔'}</span>
                  <span className="font-semibold text-gray-900">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="text-sm text-gray-600">({items.length})</span>
                </div>
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className="p-3 bg-white">
                  <div className="grid grid-cols-4 gap-3">
                    {items.map(item => (
                      <div key={item.id} className="flex flex-col items-center">
                        <img
                          src={item.thumbnail_url || item.image_url}
                          alt={item.name}
                          className="w-full aspect-square rounded-lg object-cover border border-gray-200"
                        />
                        <p className="text-xs text-gray-700 mt-1 text-center line-clamp-2">
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
