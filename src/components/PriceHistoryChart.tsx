/**
 * Price History Chart Component
 * Lightweight sparkline chart showing price trends over time
 * Uses pure SVG for minimal bundle size
 */

import React, { useMemo } from 'react';

interface PriceDataPoint {
  price: number;
  date: string;
  checked_at?: string;
}

interface PriceHistoryChartProps {
  data: PriceDataPoint[];
  height?: number;
  showAxis?: boolean;
  sparkline?: boolean;
  className?: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  data,
  height = 60,
  showAxis = false,
  sparkline = true,
  className = '',
}) => {
  // Calculate chart dimensions
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero

    // Calculate SVG points
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxPrice - point.price) / priceRange) * 100;
      return { x, y, price: point.price, date: point.date || point.checked_at };
    });

    return {
      points,
      minPrice,
      maxPrice,
      priceRange,
    };
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-xs text-gray-400">No price data available</p>
      </div>
    );
  }

  // Create SVG path
  const pathD = chartData.points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  // Determine line color based on trend
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const isDecreasing = lastPrice < firstPrice;
  const lineColor = isDecreasing ? '#10b981' : '#ef4444'; // Green for down, red for up
  const fillColor = isDecreasing ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // Create area fill path
  const areaPathD = `${pathD} L 100,100 L 0,100 Z`;

  return (
    <div className={`relative ${className}`}>
      <svg
        width="100%"
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Area fill */}
        {!sparkline && (
          <path
            d={areaPathD}
            fill={fillColor}
            opacity={0.3}
          />
        )}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={sparkline ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {!sparkline && chartData.points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={2}
            fill={lineColor}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Highlight first and last points */}
        {sparkline && (
          <>
            <circle
              cx={chartData.points[0].x}
              cy={chartData.points[0].y}
              r={1.5}
              fill={lineColor}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={chartData.points[chartData.points.length - 1].x}
              cy={chartData.points[chartData.points.length - 1].y}
              r={1.5}
              fill={lineColor}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {/* Tooltip on hover (optional) */}
      {!sparkline && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Add interactive tooltips here if needed */}
        </div>
      )}
    </div>
  );
};

export default PriceHistoryChart;
