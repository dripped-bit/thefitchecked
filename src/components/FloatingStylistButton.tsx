/**
 * Floating Stylist Button
 * Breathing button that appears on every page for instant fashion advice access
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import haptics from '../utils/haptics';
import '../styles/fashion-stylist.css';

interface FloatingStylistButtonProps {
  onClick: () => void;
}

const FloatingStylistButton: React.FC<FloatingStylistButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    haptics.light();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="floating-stylist-button"
      aria-label="Ask Fashion Stylist"
    >
      <MessageCircle className="button-icon" size={24} />
      <span className="button-text">Ask Stylist</span>
    </button>
  );
};

export default FloatingStylistButton;
