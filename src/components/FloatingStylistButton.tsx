/**
 * Floating Stylist Button
 * Collapsible button with breathing animation - center-right position
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import haptics from '../utils/haptics';
import '../styles/fashion-stylist.css';

interface FloatingStylistButtonProps {
  onClick: () => void;
}

const FloatingStylistButton: React.FC<FloatingStylistButtonProps> = ({ onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoCollapseTimer, setAutoCollapseTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-collapse after 3 seconds
  useEffect(() => {
    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
      }
    };
  }, [autoCollapseTimer]);

  const handleMouseEnter = () => {
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
    setAutoCollapseTimer(timer);
  };

  const handleClick = () => {
    haptics.light();
    if (!isExpanded) {
      setIsExpanded(true);
      // Open chat after brief delay for smooth animation
      setTimeout(() => onClick(), 200);
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`floating-stylist-button ${isExpanded ? 'expanded' : 'collapsed'}`}
      aria-label="Ask Fashion Stylist"
    >
      <MessageCircle className="button-icon" size={24} />
      <span className="button-text">Ask Stylist</span>
    </button>
  );
};

export default FloatingStylistButton;
