/**
 * Profile Screen - User profile and settings
 * Includes user info, preferences, and sign out
 */

import React from 'react';
import { User, Settings, LogOut, ChevronRight, Bell, Shield, Palette, HelpCircle } from 'lucide-react';
import authService from '../services/authService';

interface ProfileScreenProps {
  onNavigateToStyleProfile: () => void;
  onSignOut: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToStyleProfile,
  onSignOut
}) => {
  const user = authService.getCurrentUser();
  const userEmail = user?.email || 'user@example.com';
  const userName = userEmail.split('@')[0];

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await authService.signOut();
      onSignOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-300 via-pink-400 to-rose-400 px-6 pt-safe py-8">
        <h1 className="text-white text-3xl font-bold">Profile</h1>
        <p className="text-white/90 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* User Info Card */}
      <div className="px-6 -mt-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">{userName}</h2>
              <p className="text-sm text-gray-500">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-6 space-y-6">
        {/* Style & Preferences */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Style & Preferences
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={onNavigateToStyleProfile}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Style Profile</p>
                  <p className="text-xs text-gray-500">Edit your style preferences</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">Manage your alerts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Account
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Privacy & Security</p>
                  <p className="text-xs text-gray-500">Control your data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Help & Support</p>
                  <p className="text-xs text-gray-500">Get assistance</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div>
          <button
            onClick={handleSignOut}
            className="w-full bg-white rounded-2xl shadow-sm p-4 hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-600">Sign Out</span>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center text-xs text-gray-400 py-4">
          TheFitChecked v1.0.0
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
