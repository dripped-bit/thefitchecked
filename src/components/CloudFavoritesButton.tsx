import React from 'react';
import { Heart } from 'lucide-react';

interface CloudFavoritesButtonProps {
  isSelected: boolean;
  onClick: () => void;
  itemCount?: number;
}

const CloudFavoritesButton: React.FC<CloudFavoritesButtonProps> = ({ 
  isSelected, 
  onClick,
  itemCount = 0 
}) => {
  return (
    <button
      onClick={onClick}
      className="relative group"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Cloud Shape SVG */}
      <svg
        width="180"
        height="80"
        viewBox="0 0 180 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isSelected 
            ? 'drop-shadow(0 4px 12px rgba(255, 105, 180, 0.4))' 
            : 'drop-shadow(0 2px 6px rgba(255, 182, 193, 0.3))',
          transition: 'filter 0.3s ease'
        }}
      >
        {/* Cloud path - softer, more organic shape */}
        <path
          d="M 30 50 
             C 30 38, 40 30, 50 30
             C 52 22, 60 15, 70 15
             C 82 15, 92 22, 95 32
             C 100 28, 106 25, 112 25
             C 125 25, 135 35, 135 48
             C 145 48, 153 55, 153 65
             C 153 72, 147 78, 140 78
             L 40 78
             C 32 78, 27 72, 27 65
             C 27 58, 28 52, 30 50 Z"
          fill={isSelected 
            ? 'url(#cloudGradientActive)' 
            : 'url(#cloudGradient)'
          }
          style={{
            transition: 'all 0.3s ease'
          }}
        />
        
        {/* Gradient Definitions */}
        <defs>
          {/* Default gradient */}
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgba(255, 192, 203, 0.7)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'rgba(255, 182, 217, 0.6)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255, 220, 235, 0.7)', stopOpacity: 1 }} />
          </linearGradient>
          
          {/* Active/Selected gradient */}
          <linearGradient id="cloudGradientActive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgba(255, 105, 180, 0.85)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'rgba(255, 130, 200, 0.75)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255, 182, 217, 0.85)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Text and Icon Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          pointerEvents: 'none',
        }}
      >
        {/* Heart Icon */}
        <Heart
          size={18}
          fill={isSelected ? '#FF1493' : 'rgba(255, 105, 180, 0.6)'}
          color={isSelected ? '#FF1493' : 'rgba(255, 105, 180, 0.6)'}
          style={{
            transition: 'all 0.3s ease',
            marginBottom: '-4px'
          }}
        />
        
        {/* Favorites Text in Cursive */}
        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: isSelected
              ? 'linear-gradient(180deg, #8B0000 0%, #4A0000 100%)'
              : 'linear-gradient(180deg, #4A4A4A 0%, #2C2C2C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Favorites
        </span>

        {/* Item Count Badge (if > 0) */}
        {itemCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-25px',
              background: isSelected ? '#FF1493' : 'rgba(255, 105, 180, 0.9)',
              color: 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease'
            }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </div>
        )}
      </div>

      {/* Liquid Glass Backdrop Effect */}
      <div
        style={{
          position: 'absolute',
          inset: '10px',
          background: isSelected 
            ? 'rgba(255, 255, 255, 0.4)' 
            : 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '50%',
          opacity: 0.6,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          zIndex: -1
        }}
      />
    </button>
  );
};

export default CloudFavoritesButton;
