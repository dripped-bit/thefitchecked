import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

interface ClothingItem {
  id: string;
  name: string;
  image_url: string;
  category: string;
}

interface SavedOutfit {
  id: string;
  name: string;
  created_at: string;
  outfit_items: Array<{
    clothing_item: ClothingItem;
  }>;
}

interface ScheduleOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onOutfitScheduled: () => void;
}

export const ScheduleOutfitModal: React.FC<ScheduleOutfitModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onOutfitScheduled,
}) => {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSavedOutfits();
    }
  }, [isOpen]);

  const fetchSavedOutfits = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('outfits')
        .select(`
          id,
          name,
          created_at,
          outfit_items (
            clothing_item:clothing_items (
              id,
              name,
              image_url,
              category
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedOutfits(data || []);
    } catch (error) {
      console.error('Error fetching saved outfits:', error);
    }
  };

  const handleSchedule = async () => {
    if (!selectedOutfit) return;

    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const outfit = savedOutfits.find((o) => o.id === selectedOutfit);
      if (!outfit) throw new Error('Outfit not found');

      const scheduledDate = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase.from('scheduled_outfits').upsert(
        {
          user_id: user.id,
          outfit_id: selectedOutfit,
          scheduled_date: scheduledDate,
          occasion: occasion || null,
          notes: notes || null,
          was_worn: false,
        },
        {
          onConflict: 'user_id,scheduled_date',
        }
      );

      if (error) throw error;

      console.log('✅ Outfit scheduled successfully');
      onOutfitScheduled();
      onClose();
    } catch (error) {
      console.error('Error scheduling outfit:', error);
      alert('Failed to schedule outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Outfit</h2>
            <p className="text-sm text-gray-600">{formattedDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Saved Outfits Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Select from Saved Outfits
            </h3>
            {savedOutfits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No saved outfits yet</p>
                <p className="text-sm">Create outfits in your closet first</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {savedOutfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => setSelectedOutfit(outfit.id)}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all
                      ${
                        selectedOutfit === outfit.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Outfit Images */}
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {outfit.outfit_items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded overflow-hidden bg-gray-100"
                        >
                          <img
                            src={item.clothing_item.image_url}
                            alt={item.clothing_item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Outfit Name */}
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {outfit.name || 'Unnamed Outfit'}
                    </div>

                    {/* Selected Check */}
                    {selectedOutfit === outfit.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occasion (optional)
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Work Meeting, Date Night"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this outfit..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedOutfit || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Scheduling...' : 'Schedule Outfit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOutfitModal;
