/**
 * Closet Analytics Page
 * Provides intelligent insights about wardrobe using OpenAI
 * Features: Total value, category spending, color analysis, best value items
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Loader,
  Share2
} from 'lucide-react';
import closetAnalyticsService, { AnalyticsData, CategorySpending, ColorData, BestValueItem } from '../services/closetAnalyticsService';
import ShareStatsModal from '../components/ShareStatsModal';
import UnwornItemsAlert from '../components/UnwornItemsAlert';

interface ClosetAnalyticsProps {
  onBack: () => void;
}

export default function ClosetAnalytics({ onBack }: ClosetAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBestValueItem, setSelectedBestValueItem] = useState<BestValueItem | null>(null);
  // NEW: Share stats modal
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await closetAnalyticsService.getAnalytics();
      setData(analyticsData);
    } catch (err) {
      console.error('❌ [ANALYTICS] Error loading data:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const analyticsData = await closetAnalyticsService.getAnalytics(true);
      setData(analyticsData);
    } catch (err) {
      console.error('❌ [ANALYTICS] Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600 mb-6">{error || 'No data available'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasData = data.categories.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-40">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📊 Closet Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* NEW: Share Stats Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-3.5 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all mb-6"
            >
              <Share2 className="w-5 h-5" />
              📸 Share My Stats
            </button>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard 
                icon="💰" 
                value={`$${data.totalValue.toLocaleString()}`} 
                label="Closet Value" 
              />
              <SummaryCard 
                icon="🎯" 
                value={`$${data.wishlistTotal.toLocaleString()}`} 
                label="Wishlist" 
              />
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-xl font-bold text-gray-900">{data.itemsThisMonth}</div>
                  <div className="text-xs text-gray-500 mt-1">Items Added This Month</div>
                </div>
                {/* NEW: Unworn Items Alert */}
                {data.unwornItems && data.unwornItems > 0 && (
                  <UnwornItemsAlert
                    unwornCount={data.unwornItems}
                    unwornValue={data.unwornValue || 0}
                    unwornByCategory={data.unwornByCategory}
                  />
                )}
              </div>
            </div>

            {/* Top Spending */}
            {data.categories.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div 
                  className="flex justify-between items-center mb-4 cursor-pointer"
                  onClick={() => setShowCategoryModal(true)}
                >
                  <h3 className="text-lg font-semibold text-gray-900">💸 TOP SPENDING</h3>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    See All <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
                
                <TopThreeCategories data={data.categories} />
              </div>
            )}

            {/* Wishlist Stacked Bar */}
            {data.wishlistByCategory.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💝 WISHLIST: ${data.wishlistTotal.toFixed(2)}
                </h3>
                <WishlistStackedBar data={data.wishlistByCategory} total={data.wishlistTotal} />
              </div>
            )}

            {/* Top Colors */}
            {data.colors.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div 
                  className="flex justify-between items-center mb-4 cursor-pointer"
                  onClick={() => setShowColorModal(true)}
                >
                  <h3 className="text-lg font-semibold text-gray-900">🎨 TOP COLORS</h3>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    See All <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
                
                <TopFiveColors data={data.colors} />
              </div>
            )}

            {/* Best Value */}
            {data.bestValueItems.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 BEST VALUE</h3>
                <BestValueSection 
                  items={data.bestValueItems}
                  onItemClick={(item) => setSelectedBestValueItem(item)}
                />
              </div>
            )}

            {/* Last Updated */}
            <p className="text-xs text-center text-gray-400">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </>
        )}
      </div>

      {/* Best Value Modal */}
      <BestValueModal
        item={selectedBestValueItem}
        onClose={() => setSelectedBestValueItem(null)}
      />

      {/* Category Modal */}
      {showCategoryModal && data && (
        <CategoryModal 
          data={data.categories} 
          onClose={() => setShowCategoryModal(false)} 
        />
      )}

      {/* Color Modal */}
      {showColorModal && data && (
        <ColorModal 
          data={data.colors} 
          onClose={() => setShowColorModal(false)} 
        />
      )}

      {/* NEW: Share Stats Modal */}
      {showShareModal && data && (
        <ShareStatsModal
          data={data}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
      <div className="text-6xl mb-4">👗</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No Analytics Yet</h2>
      <p className="text-gray-600 mb-1">Add items to your closet with prices to see insights</p>
      <p className="text-sm text-gray-500">Track spending, colors, and best value items</p>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  icon: string;
  value: string | number;
  label: string;
}

function SummaryCard({ icon, value, label }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// Top Three Categories Component
interface TopThreeCategoriesProps {
  data: CategorySpending[];
}

function TopThreeCategories({ data }: TopThreeCategoriesProps) {
  return (
    <div className="space-y-3">
      {data.slice(0, 3).map((cat, index) => (
        <div key={cat.category}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium capitalize">{cat.category}</span>
            <span className="text-sm font-bold">${cat.total.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${cat.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Wishlist Stacked Bar Component
interface WishlistStackedBarProps {
  data: any[];
  total: number;
}

function WishlistStackedBar({ data, total }: WishlistStackedBarProps) {
  return (
    <div>
      <div className="flex h-8 rounded-full overflow-hidden">
        {data.map((cat, index) => {
          const percentage = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <div
              key={cat.category}
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{
                width: `${percentage}%`,
                backgroundColor: cat.color,
                minWidth: percentage > 5 ? 'auto' : '0'
              }}
              title={`${cat.category}: $${cat.total.toFixed(2)}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {data.map((cat) => (
          <div key={cat.category} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-gray-600">{cat.category}</span>
            <span className="font-semibold">${cat.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top Five Colors Component
interface TopFiveColorsProps {
  data: ColorData[];
}

function TopFiveColors({ data }: TopFiveColorsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {data.slice(0, 5).map((color) => (
        <div key={color.color} className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: color.hex }}
          />
          <div>
            <div className="text-sm font-medium capitalize">{color.color}</div>
            <div className="text-xs text-gray-500">{color.count} items</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Best Value Section Component
interface BestValueSectionProps {
  items: BestValueItem[];
  onItemClick: (item: BestValueItem) => void;
}

function BestValueSection({ items, onItemClick }: BestValueSectionProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isTracked = item.timesWorn > 0;
        const displayText = isTracked 
          ? `$${item.costPerWear.toFixed(2)}/wear • ${item.timesWorn} wears`
          : 'Potential great value • Not tracked yet';
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
          >
            <div className="text-2xl font-bold text-gray-400">{index + 1}.</div>
            
            {/* Item Image */}
            {(item.thumbnail_url || item.image_url) && (
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img 
                  src={item.thumbnail_url || item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className={`text-sm ${isTracked ? 'text-gray-500' : 'text-blue-600'}`}>
                {displayText}
              </div>
            </div>
            
            <div className="flex gap-1">
              {Array.from({ length: item.stars }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg">⭐</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Best Value Modal Component
interface BestValueModalProps {
  item: BestValueItem | null;
  onClose: () => void;
}

function BestValueModal({ item, onClose }: BestValueModalProps) {
  if (!item) return null;

  const isTracked = item.timesWorn > 0;
  const imageUrl = item.thumbnail_url || item.image_url;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="flex items-start gap-4 mb-4">
          {/* Item Image */}
          {imageUrl && (
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
            {item.category && (
              <p className="text-sm text-gray-500 capitalize mt-1">{item.category}</p>
            )}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: item.stars }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">⭐</span>
              ))}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {isTracked ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Cost Per Wear</div>
                <div className="text-2xl font-bold text-green-600">
                  ${item.costPerWear.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Times Worn</div>
                <div className="text-2xl font-bold text-gray-900">
                  {item.timesWorn}x
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="text-sm text-gray-600">Original Price</div>
              <div className="text-xl font-semibold text-gray-900">
                ${item.price.toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Original Price</div>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                ${item.price.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600 font-medium">
                📊 Wear tracking not enabled yet
              </div>
            </div>
          </div>
        )}

        {/* Value Explanation */}
        <div className={`${isTracked ? 'bg-blue-50' : 'bg-amber-50'} rounded-xl p-4`}>
          <h4 className={`font-semibold ${isTracked ? 'text-blue-900' : 'text-amber-900'} mb-2`}>
            💡 {isTracked ? "Why It's Great Value" : "Potential Value"}
          </h4>
          <p className={`text-sm ${isTracked ? 'text-blue-800' : 'text-amber-800'}`}>
            {isTracked ? (
              <>
                You've worn this {item.timesWorn} times, bringing the cost per wear down to just 
                ${item.costPerWear.toFixed(2)}. {item.stars >= 4 ? 'This is an exceptional value!' : 'Keep wearing it to improve the value!'}
              </>
            ) : (
              <>
                This item has great value potential! Start tracking your wears to see your actual cost per wear. 
                Based on similar items, this could become one of your best investments.
              </>
            )}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Category Modal Component
interface CategoryModalProps {
  data: CategorySpending[];
  onClose: () => void;
}

function CategoryModal({ data, onClose }: CategoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">💸 Spending by Category</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {data.map((cat) => (
            <div key={cat.category}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold capitalize">{cat.category}</span>
                <span className="text-gray-600">{cat.itemCount} items</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <span className="font-bold text-green-600 min-w-[80px] text-right">
                  ${cat.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Color Modal Component
interface ColorModalProps {
  data: ColorData[];
  onClose: () => void;
}

function ColorModal({ data, onClose }: ColorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">🎨 Color Distribution</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {data.map((color) => (
            <div key={color.color} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <div>
                  <div className="font-semibold capitalize text-gray-900">{color.color}</div>
                  <div className="text-sm text-gray-500">{color.percentage.toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{color.count}</div>
                <div className="text-xs text-gray-500">items</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
