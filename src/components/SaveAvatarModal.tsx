import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

interface SaveAvatarModalProps {
  isOpen: boolean;
  onSave: (avatarName: string) => void;
  onSkip: () => void;
}

const SaveAvatarModal: React.FC<SaveAvatarModalProps> = ({ isOpen, onSave, onSkip }) => {
  const [avatarName, setAvatarName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(avatarName.trim() || 'My Avatar');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Save className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Save Your Avatar?</h2>
          <p className="text-gray-600">
            Save this avatar to quickly access it later. You can save up to 3 avatars.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar Name (Optional)
          </label>
          <input
            type="text"
            value={avatarName}
            onChange={(e) => setAvatarName(e.target.value)}
            placeholder="e.g., My Casual Look"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={30}
          />
          <p className="text-xs text-gray-500 mt-1">
            If left blank, we'll use a default name
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Save Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAvatarModal;
