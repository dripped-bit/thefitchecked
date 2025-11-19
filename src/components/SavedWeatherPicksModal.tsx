/**
 * Saved Weather Picks Modal
 * 
 * Displays all outfits saved from Weather Picks feature
 * Allows quick access to favorite weather-appropriate combinations
 */

import React, { useState } from 'react';
import { X, Heart, Trash2, Calendar, Cloud, Sun, CloudRain } from 'lucide-react';
import { useSavedOutfits } from '../hooks/useSavedOutfits';
import { useCloset } from '../hooks/useCloset';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import haptics from '../utils/haptics';
import { getSmartImageUrl } from '../services/imageUtils';

interface SavedWeatherPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const SavedWeatherPicksModal: React.FC<SavedWeatherPicksModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const { data: savedOutfits, isLoading, error: queryError } = useSavedOutfits(userId);
  const queryClient = useQueryClient();
  
  // Debug logging
  console.log('🔍 [SavedWeatherPicksModal] isOpen:', isOpen);
  console.log('🔍 [SavedWeatherPicksModal] userId:', userId);
  console.log('🔍 [SavedWeatherPicksModal] isLoading:', isLoading);
  console.log('🔍 [SavedWeatherPicksModal] queryError:', queryError);
  console.log('🔍 [SavedWeatherPicksModal] savedOutfits:', savedOutfits);
  
  // Filter for weather picks only
  const weatherPickOutfits = savedOutfits?.filter(
    outfit => outfit.tags?.includes('weather_picks')
  ) || [];
  
  console.log('🔍 [SavedWeatherPicksModal] weatherPickOutfits:', weatherPickOutfits);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Delete outfit mutation
  const deleteMutation = useMutation({
    mutationFn: async (outfitId: string) => {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedOutfits'] });
      haptics.success();
      setShowDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Failed to delete outfit:', error);
      haptics.error();
    }
  });

  const handleDelete = (outfitId: string) => {
    haptics.medium();
    setShowDeleteConfirm(outfitId);
  };

  const confirmDelete = (outfitId: string) => {
    deleteMutation.mutate(outfitId);
  };

  const getWeatherIcon = (weather?: string[]) => {
    if (!weather || weather.length === 0) return <Cloud className="w-4 h-4" />;
    const condition = weather[0].toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="w-4 h-4" />;
    if (condition.includes('sun') || condition.includes('clear')) return <Sun className="w-4 h-4" />;
    return <Cloud className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  console.log('✅ [SavedWeatherPicksModal] Rendering modal!');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => {
          haptics.light();
          onClose();
        }}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-amber-500" fill="currentColor" />
              Saved Weather Picks
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {weatherPickOutfits.length} saved {weatherPickOutfits.length === 1 ? 'outfit' : 'outfits'}
            </p>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500 mt-4">Loading saved outfits...</p>
            </div>
          ) : queryError ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <X className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Outfits
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                {queryError instanceof Error ? queryError.message : 'Something went wrong'}
              </p>
              <button
                onClick={() => {
                  haptics.light();
                  queryClient.invalidateQueries({ queryKey: ['savedOutfits'] });
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          ) : weatherPickOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Heart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Saved Outfits Yet
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Tap the heart icon on outfit cards to save your favorites
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {weatherPickOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Outfit Items Preview */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50">
                    {[outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear]
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((item, index) => (
                        <div
                          key={item?.id || index}
                          className="aspect-square rounded-lg overflow-hidden bg-white"
                        >
                          {item?.image_url ? (
                            <img
                              src={getSmartImageUrl('wardrobe', item.image_url, 'thumbnail')}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Outfit Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                      {outfit.name}
                    </h3>

                    {/* Weather Badge */}
                    {outfit.weather && outfit.weather.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit mb-2">
                        {getWeatherIcon(outfit.weather)}
                        <span className="font-medium">{outfit.weather[0]}</span>
                      </div>
                    )}

                    {/* Saved Date */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Saved {new Date(outfit.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          haptics.medium();
                          // TODO: Implement wear today functionality
                          alert('Wear today functionality coming soon!');
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold rounded-lg hover:from-amber-500 hover:to-orange-600 transition-all active:scale-95"
                      >
                        Wear Today
                      </button>
                      <button
                        onClick={() => handleDelete(outfit.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setShowDeleteConfirm(null)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[61] bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Outfit?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently remove this outfit from your saved weather picks.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  haptics.light();
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  haptics.heavy();
                  confirmDelete(showDeleteConfirm);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SavedWeatherPicksModal;
