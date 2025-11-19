import { useState } from 'react';
import { Shirt, ShoppingBag, Footprints, Watch, Check } from 'lucide-react';
import type { ClothingItem } from '../../hooks/useCloset';

interface ClothingTabViewProps {
  clothesByCategory: Record<string, ClothingItem[]>;
  packedItemIds: Set<string>;
}

export function ClothingTabView({ 
  clothesByCategory, 
  packedItemIds 
}: ClothingTabViewProps) {
  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms' | 'shoes' | 'accessories'>('tops');

  const tabs = [
    { 
      id: 'tops' as const, 
      label: 'Tops', 
      icon: Shirt,
      items: clothesByCategory.tops || []
    },
    { 
      id: 'bottoms' as const, 
      label: 'Bottoms', 
      icon: ShoppingBag,
      items: clothesByCategory.bottoms || []
    },
    { 
      id: 'shoes' as const, 
      label: 'Shoes', 
      icon: Footprints,
      items: clothesByCategory.shoes || []
    },
    { 
      id: 'accessories' as const, 
      label: 'Accessories', 
      icon: Watch,
      items: clothesByCategory.accessories || []
    },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const currentItems = currentTab?.items || [];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Clothing Items for Trip
        </h3>
      </div>

      {/* Tab Bar - Apple Style */}
      <div className="flex border-b border-gray-200 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.items.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-6 py-3 transition-colors ${
                isActive
                  ? 'border-b-2 border-blue-400'
                  : 'border-b-2 border-transparent'
              }`}
              aria-label={`View ${tab.label}`}
            >
              <Icon 
                className={`w-6 h-6 ${
                  isActive ? 'text-blue-400' : 'text-gray-400'
                }`}
                strokeWidth={1.5}
              />
              <span className={`text-sm ${
                isActive ? 'text-blue-400 font-medium' : 'text-gray-600'
              }`}>
                {tab.label}
              </span>
              {count > 0 && (
                <span className={`text-xs ${
                  isActive ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {currentItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {currentTab?.label.toLowerCase()} planned for this trip</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentItems.map((item) => {
              const isPacked = packedItemIds.has(item.id);
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    {isPacked && (
                      <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                        <Check className="w-3 h-3" />
                        Packed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
