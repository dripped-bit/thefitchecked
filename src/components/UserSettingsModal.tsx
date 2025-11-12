/**
 * User Settings Modal
 * Allows users to edit their profile information including location for weather
 */

import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Calendar, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import UserService from '../services/userService';
import { UserData } from '../types/user';
import { glassModalClasses } from '../styles/glassEffects';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (userData: UserData) => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdate
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen) {
      const data = UserService.getUserData();
      setUserData(data);
      setCity(data?.city || '');
      setState(data?.state || '');
      setSaveStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen || !userData) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setErrorMessage('');

      // Update location
      if (city && state) {
        const updatedData = await UserService.updateUserLocation(city, state);
        if (updatedData) {
          setUserData(updatedData);
          setSaveStatus('success');
          
          // Notify parent component
          if (onUpdate) {
            onUpdate(updatedData);
          }

          // Auto-close after success
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setErrorMessage('Please enter both city and state');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage('Failed to update location. Please try again.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = city !== (userData.city || '') || state !== (userData.state || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${glassModalClasses.light} max-w-md w-full mx-4 transform transition-all duration-300`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
            <p className="text-gray-600">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info (Read-only) */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              Name
            </label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              {userData.firstName}
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              Birthday
            </label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              {new Date(userData.birthday).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Location (Editable) */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-blue-200 focus:outline-none focus:ring-2"
                disabled={isSaving}
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-blue-200 focus:outline-none focus:ring-2"
                disabled={isSaving}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              📍 Used for weather-appropriate outfit suggestions
            </p>
            {userData.timezone && (
              <p className="mt-1 text-xs text-gray-500">
                🕐 Timezone: {userData.timezone}
              </p>
            )}
          </div>

          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Settings saved successfully!
              </span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700 font-medium">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>

          {!hasChanges && (
            <p className="text-xs text-center text-gray-500">
              Make changes to enable save button
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
