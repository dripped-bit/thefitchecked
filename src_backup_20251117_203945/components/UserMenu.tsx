/**
 * User Menu Component
 * Displays user profile dropdown with authentication options
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Heart, ShoppingBag, LogIn } from 'lucide-react';
import authService, { AuthUser } from '../services/authService';
import { glassModalClasses } from '../styles/glassEffects';

interface UserMenuProps {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout?: () => void;
  onNavigateToCloset?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLoginClick, onLogout, onNavigateToCloset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const { error } = await authService.signOut();
    if (!error) {
      setIsOpen(false);
      onLogout?.();
    }
  };

  // Not logged in - show login button
  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="ios-button-primary flex items-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign In</span>
      </button>
    );
  }

  // Logged in - show user menu
  return (
    <div ref={menuRef} className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center transition-opacity hover:opacity-80"
      >
        <div className="w-6 h-6 bg-gradient-to-r from-ios-purple to-ios-pink rounded-full flex items-center justify-center shadow-ios-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 ios-card rounded-ios-lg shadow-ios-xl py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-ios-separator">
            <p className="ios-callout font-semibold truncate">{user.email}</p>
            <p className="ios-caption-1 text-ios-label-tertiary mt-1">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateToCloset?.();
              }}
              className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-ios-label-secondary" />
              <span>My Closet</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-ios-separator pt-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 text-ios-red transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
