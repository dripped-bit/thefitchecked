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
        className="absolute inset-0 ios-blur bg-black/50" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative ios-card ios-slide-up max-w-md w-full mx-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-ios-blue/10 to-ios-purple/10 p-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={onClose}
              className="text-ios-label-tertiary hover:text-ios-label-secondary transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-ios-blue to-ios-purple rounded-full mb-4 shadow-ios-md">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="ios-large-title mb-2">Settings</h2>
            <p className="ios-body text-ios-label-secondary">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info (Read-only) */}
          <div>
            <label className="flex items-center ios-subheadline font-semibold mb-2">
              <User className="w-4 h-4 mr-2 text-ios-label-tertiary" />
              Name
            </label>
            <div className="px-4 py-3 rounded-ios-lg border border-ios-separator bg-ios-fill">
              {userData.firstName}
            </div>
          </div>

          <div>
            <label className="flex items-center ios-subheadline font-semibold mb-2">
              <Calendar className="w-4 h-4 mr-2 text-ios-label-tertiary" />
              Birthday
            </label>
            <div className="px-4 py-3 rounded-ios-lg border border-ios-separator bg-ios-fill">
              {new Date(userData.birthday).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Location (Editable) */}
          <div>
            <label className="flex items-center ios-subheadline font-semibold mb-2">
              <MapPin className="w-4 h-4 mr-2 text-ios-blue" />
              Location
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="ios-input"
                disabled={isSaving}
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="ios-input"
                disabled={isSaving}
              />
            </div>
            <p className="mt-2 ios-caption-1 text-ios-label-tertiary">
              📍 Used for weather-appropriate outfit suggestions
            </p>
            {userData.timezone && (
              <p className="mt-1 ios-caption-1 text-ios-label-tertiary">
                🕐 Timezone: {userData.timezone}
              </p>
            )}
          </div>

          {/* Status Messages */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-ios-green/10 border border-ios-green/20 rounded-ios-lg">
              <CheckCircle className="w-5 h-5 text-ios-green" />
              <span className="ios-callout font-semibold text-ios-green">
                Settings saved successfully!
              </span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-ios-red/10 border border-ios-red/20 rounded-ios-lg">
              <AlertCircle className="w-5 h-5 text-ios-red" />
              <span className="ios-callout font-semibold text-ios-red">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="ios-button-primary w-full flex items-center justify-center"
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
            <p className="ios-caption-1 text-center text-ios-label-tertiary">
              Make changes to enable save button
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
