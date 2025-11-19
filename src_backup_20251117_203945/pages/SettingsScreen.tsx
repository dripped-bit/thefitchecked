/**
 * Settings Screen - User settings, preferences, and account management
 * Comprehensive settings page with sign out functionality
 */

import React, { useState } from 'react';
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  Moon,
  Globe,
  Camera,
  Lock,
  Trash2,
  Mail,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import authService from '../services/authService';

interface SettingsScreenProps {
  onNavigateToStyleProfile: () => void;
  onSignOut: () => void;
  onBack?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToStyleProfile,
  onSignOut,
  onBack
}) => {
  const user = authService.getCurrentUser();
  const userEmail = user?.email || 'user@example.com';
  const userName = userEmail.split('@')[0];

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoSaveOutfits, setAutoSaveOutfits] = useState(true);
  const [highQualityImages, setHighQualityImages] = useState(true);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await authService.signOut();
      onSignOut();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('⚠️ WARNING: This will permanently delete your account and all data. This action cannot be undone.\n\nAre you sure you want to continue?')) {
      if (confirm('Final confirmation: Type your email to confirm account deletion.')) {
        // TODO: Implement account deletion
        alert('Account deletion is not yet implemented. Please contact support.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-300 via-pink-400 to-rose-400 px-6 pt-safe pb-6">
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronRight className="w-6 h-6 text-white transform rotate-180" />
            </button>
          )}
          <div className="flex-1" />
        </div>
        <h1 className="text-white text-3xl font-bold">Settings</h1>
        <p className="text-white/90 text-sm mt-1">Manage your preferences and account</p>
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
            <button className="text-pink-500 text-sm font-medium">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-6 space-y-6">
        {/* Style & Appearance */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Style & Appearance
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
                  <p className="text-xs text-gray-500">Edit your fashion preferences</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Moon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={darkModeEnabled}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 opacity-50"></div>
              </label>
            </div>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Language</p>
                  <p className="text-xs text-gray-500">English (US)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Notifications
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Outfit suggestions & reminders</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Weekly style tips & updates</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* App Preferences */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            App Preferences
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Auto-save Outfits</p>
                  <p className="text-xs text-gray-500">Save generated looks automatically</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveOutfits}
                  onChange={(e) => setAutoSaveOutfits(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">High Quality Images</p>
                  <p className="text-xs text-gray-500">Better quality, more storage</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={highQualityImages}
                  onChange={(e) => setHighQualityImages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Privacy & Security
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Privacy Settings</p>
                  <p className="text-xs text-gray-500">Control your data & visibility</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your security credentials</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Data & Storage</p>
                  <p className="text-xs text-gray-500">Manage your stored content</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Help & Support */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Help & Support
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Help Center</p>
                  <p className="text-xs text-gray-500">FAQs & tutorials</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-xs text-gray-500">Get help from our team</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">About TheFitChecked</p>
                  <p className="text-xs text-gray-500">Version 1.0.0</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 px-2">
            Danger Zone
          </h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-red-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors border-b border-red-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-600">Sign Out</p>
                  <p className="text-xs text-red-500">End your current session</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-600">Delete Account</p>
                  <p className="text-xs text-red-500">Permanently remove your data</p>
                </div>
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-6 space-y-2">
          <p>TheFitChecked v1.0.0</p>
          <div className="flex justify-center gap-4">
            <button className="hover:text-pink-500 transition-colors">Privacy Policy</button>
            <span>•</span>
            <button className="hover:text-pink-500 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
