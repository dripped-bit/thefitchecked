/**
 * Price Alert Banner Component
 * Displays price drop, sale, and stock alerts for wishlist items
 */

import React from 'react';

export interface PriceAlertData {
  type: 'price_drop' | 'sale_countdown' | 'back_in_stock' | 'target_reached';
  currentPrice: number;
  originalPrice?: number;
  dropAmount?: number;
  percentage?: number;
  saleEnds?: string; // ISO date string
  daysLeft?: number;
  message?: string;
}

interface PriceAlertBannerProps {
  alert: PriceAlertData;
  className?: string;
}

const PriceAlertBanner: React.FC<PriceAlertBannerProps> = ({ alert, className = '' }) => {
  
  // Calculate days left for sale countdown
  const calculateDaysLeft = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Format price
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // Render based on alert type
  const renderAlert = () => {
    switch (alert.type) {
      case 'price_drop':
        return (
          <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 rounded-lg ${className}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">
                  Price dropped {formatPrice(alert.dropAmount || 0)}! Was {formatPrice(alert.originalPrice || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Save {alert.percentage?.toFixed(1)}% • Now {formatPrice(alert.currentPrice)}
                </p>
              </div>
            </div>
          </div>
        );

      case 'sale_countdown':
        const daysLeft = alert.daysLeft || (alert.saleEnds ? calculateDaysLeft(alert.saleEnds) : 0);
        const endDate = alert.saleEnds ? new Date(alert.saleEnds).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : '';

        return (
          <div className={`bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-3 rounded-lg ${className}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">⏰</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Sale ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {endDate} • {formatPrice(alert.currentPrice)} 
                  {alert.originalPrice && ` (was ${formatPrice(alert.originalPrice)})`}
                </p>
              </div>
            </div>
          </div>
        );

      case 'back_in_stock':
        return (
          <div className={`bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-3 rounded-lg ${className}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">📦</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-700">
                  Back in stock!
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Available now at {formatPrice(alert.currentPrice)}
                </p>
              </div>
            </div>
          </div>
        );

      case 'target_reached':
        return (
          <div className={`bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-3 rounded-lg ${className}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">🎯</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-700">
                  Target price reached!
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Now {formatPrice(alert.currentPrice)} 
                  {alert.originalPrice && ` (was ${formatPrice(alert.originalPrice)})`}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderAlert();
};

export default PriceAlertBanner;
