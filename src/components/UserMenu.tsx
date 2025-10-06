/**
 * User Menu Component
 * Displays user profile dropdown with authentication options
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Heart, ShoppingBag, LogIn } from 'lucide-react';
import authService, { AuthUser } from '../services/authService';

interface UserMenuProps {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLoginClick, onLogout }) => {
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
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
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
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
            {user.email}
          </p>
          {!user.emailConfirmed && (
            <p className="text-xs text-amber-600">Email not verified</p>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile/settings
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to favorites
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-gray-600" />
              <span>My Favorites</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to saved outfits
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-gray-600" />
              <span>My Outfits</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
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
