import React, { useState, useEffect, useRef } from 'react';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import './AutoScrollSlider.css';

interface AutoScrollSliderProps {
  onScrollSpeedChange: (speed: number) => void; // -100 to +100
}

const AutoScrollSlider: React.FC<AutoScrollSliderProps> = ({ 
  onScrollSpeedChange 
}) => {
  const [sliderValue, setSliderValue] = useState(50); // 0-100, 50 = center
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lastHapticValue = useRef(50);
  const doubleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Load hidden preference from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem('fashionfeed_slider_hidden');
    setIsHidden(hidden === 'true');
  }, []);

  // Convert slider value (0-100) to scroll speed (-100 to +100)
  const getScrollSpeed = (value: number): number => {
    // Center (50) = 0 speed
    // Top (0) = -100 (scroll up fast)
    // Bottom (100) = +100 (scroll down fast)
    return (value - 50) * 2;
  };

  // Calculate slider value from mouse/touch position
  const calculateValueFromPosition = (clientY: number): number => {
    if (!containerRef.current) return 50;
    
    const rect = containerRef.current.getBoundingClientRect();
    const trackHeight = rect.height - 30; // Account for padding
    const relativeY = clientY - rect.top - 15; // Adjust for top padding
    
    let newValue = (relativeY / trackHeight) * 100;
    
    // Clamp between 0 and 100
    newValue = Math.max(0, Math.min(100, newValue));
    
    return newValue;
  };

  // Handle value change
  const handleValueChange = (newValue: number) => {
    setSliderValue(newValue);
    onScrollSpeedChange(getScrollSpeed(newValue));

    // Haptic feedback every 10% change
    if (Capacitor.isNativePlatform()) {
      const hapticThreshold = Math.floor(newValue / 10);
      const lastThreshold = Math.floor(lastHapticValue.current / 10);
      
      if (hapticThreshold !== lastThreshold) {
        Haptics.impact({ style: 'light' });
        lastHapticValue.current = newValue;
      }
    }
  };

  // Mouse/Touch move handler
  const handleMove = (clientY: number) => {
    if (!isDraggingRef.current) return;
    
    const newValue = calculateValueFromPosition(clientY);
    handleValueChange(newValue);
  };

  // Start dragging
  const handleDragStart = (clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    
    const newValue = calculateValueFromPosition(clientY);
    handleValueChange(newValue);
  };

  // End dragging - spring back to center
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Spring animation back to center
    setTimeout(() => {
      setSliderValue(50);
      onScrollSpeedChange(0);
      
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: 'medium' });
      }
    }, 100);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  // Double-tap to hide/show
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent tap if dragging
    if (isDraggingRef.current) return;
    
    // Don't count tap if clicking on thumb
    if ((e.target as HTMLElement).closest('.slider-thumb')) return;
    
    tapCount.current++;

    if (tapCount.current === 1) {
      doubleTapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
      }, 300);
    } else if (tapCount.current === 2) {
      // Double tap detected
      if (doubleTapTimeout.current) {
        clearTimeout(doubleTapTimeout.current);
      }
      tapCount.current = 0;
      
      setIsHidden(!isHidden);
      localStorage.setItem('fashionfeed_slider_hidden', (!isHidden).toString());
      
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: 'success' });
      }
    }
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newValue = sliderValue;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.max(0, sliderValue - 5);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.min(100, sliderValue + 5);
        break;
      case 'Home':
        e.preventDefault();
        newValue = 0;
        break;
      case 'End':
        e.preventDefault();
        newValue = 100;
        break;
      case 'Escape':
        e.preventDefault();
        newValue = 50;
        onScrollSpeedChange(0);
        break;
      default:
        return;
    }
    
    handleValueChange(newValue);
  };

  if (isHidden) {
    return (
      <div 
        className="scroll-slider-tab"
        onClick={handleTap}
        role="button"
        aria-label="Show scroll speed slider"
        tabIndex={0}
      >
        <span className="pencil-icon">✏️</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`scroll-slider-container ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label={`Auto-scroll speed slider, currently at ${Math.round(sliderValue)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderValue)}
      aria-orientation="vertical"
      tabIndex={0}
    >
      {/* Liquid glass background */}
      <div className="slider-glass-bg" />

      {/* Vertical slider track */}
      <div className="slider-track-container">
        {/* Filled portion (below thumb) */}
        <div 
          className="slider-track-filled"
          style={{ height: `${sliderValue}%` }}
        />
        
        {/* Empty portion (above thumb) */}
        <div 
          className="slider-track-empty"
          style={{ height: `${100 - sliderValue}%` }}
        />

        {/* Pencil thumb */}
        <div
          className="slider-thumb"
          style={{ top: `${sliderValue}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <span className="pencil-icon">✏️</span>
        </div>
      </div>

      {/* Subtle pulse animation when idle */}
      {!isDragging && <div className="pulse-ring" />}
    </div>
  );
};

export default AutoScrollSlider;
