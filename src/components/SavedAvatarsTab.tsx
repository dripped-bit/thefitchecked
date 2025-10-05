import React from 'react';
import { X, Trash2, Check, User } from 'lucide-react';
import avatarManagementService from '../services/avatarManagementService';
import { SavedAvatar } from '../services/avatarStorageService';

interface SavedAvatarsTabProps {
  onClose: () => void;
  onAvatarSelect: (avatarId: string) => void;
  currentAvatarId?: string;
}

const SavedAvatarsTab: React.FC<SavedAvatarsTabProps> = ({
  onClose,
  onAvatarSelect,
  currentAvatarId
}) => {
  const [savedAvatars, setSavedAvatars] = React.useState<SavedAvatar[]>([]);
  const [selectedForDelete, setSelectedForDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = () => {
    const avatars = avatarManagementService.getSavedAvatars();
    setSavedAvatars(avatars);
  };

  const handleDeleteAvatar = (avatarId: string) => {
    if (selectedForDelete === avatarId) {
      // Confirm delete
      avatarManagementService.deleteAvatar(avatarId);
      loadAvatars();
      setSelectedForDelete(null);
    } else {
      // First click - show confirmation
      setSelectedForDelete(avatarId);
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    onAvatarSelect(avatarId);
    onClose();
  };

  // Create 3 slots
  const avatarSlots = Array.from({ length: 3 }, (_, index) => {
    const avatar = savedAvatars[index];
    return { avatar, index };
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Saved Avatars</h2>
            <p className="text-sm text-gray-500 mt-1">
              You can save up to 3 avatars. Click an avatar to use it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Avatar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {avatarSlots.map(({ avatar, index }) => (
              <div
                key={index}
                className={`relative border-2 rounded-xl p-4 transition-all ${
                  avatar
                    ? currentAvatarId === avatar.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                    : 'border-dashed border-gray-300 bg-gray-50'
                }`}
                onClick={() => avatar && handleSelectAvatar(avatar.id)}
              >
                {avatar ? (
                  <>
                    {/* Current Avatar Indicator */}
                    {currentAvatarId === avatar.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    {/* Avatar Image */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Avatar Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {avatar.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Created {new Date(avatar.createdAt).toLocaleDateString()}
                      </p>

                      {avatar.isDefault && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAvatar(avatar.id);
                      }}
                      className={`mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                        selectedForDelete === avatar.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {selectedForDelete === avatar.id ? 'Confirm Delete' : 'Delete'}
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="aspect-square rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <User className="w-16 h-16 mb-2" />
                    <p className="text-sm">Empty Slot</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Avatars are displayed in their default outfit (white tank, blue shorts).
              Click any saved avatar to use it on your avatar homepage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedAvatarsTab;
