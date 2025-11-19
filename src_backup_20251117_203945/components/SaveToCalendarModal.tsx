import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  ShoppingBag,
  Bell,
  Check
} from 'lucide-react';
import { glassModalClasses } from '../styles/glassEffects';

export interface CalendarSaveData {
  date: string;
  occasion: string;
  purchaseLink?: string;
  needsPurchaseReminder: boolean;
}

interface SaveToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CalendarSaveData) => void;
  defaultOccasion?: string;
  defaultDate?: string;
  outfitImageUrl?: string;
  outfitName?: string;
}

const SaveToCalendarModal: React.FC<SaveToCalendarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultOccasion = '',
  defaultDate = '',
  outfitImageUrl = '',
  outfitName = ''
}) => {
  const [date, setDate] = useState<string>('');
  const [occasion, setOccasion] = useState<string>(defaultOccasion);
  const [purchaseLink, setPurchaseLink] = useState<string>('');
  const [needsReminder, setNeedsReminder] = useState<boolean>(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default date to the occasion date or today
      const defaultDateValue = defaultDate || new Date().toISOString().split('T')[0];
      setDate(defaultDateValue);
      setOccasion(defaultOccasion);
      setPurchaseLink('');
      setNeedsReminder(false);
    }
  }, [isOpen, defaultDate, defaultOccasion]);

  const handleSave = () => {
    if (!date || !occasion) {
      alert('Please fill in the date and occasion');
      return;
    }

    onSave({
      date,
      occasion,
      purchaseLink: purchaseLink.trim() || undefined,
      needsPurchaseReminder: needsReminder
    });
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`${glassModalClasses.light} max-w-md w-full`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Add to Calendar
                </h2>
                <p className="text-sm text-gray-600">Schedule your outfit</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Outfit Preview */}
          {outfitImageUrl && (
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <img
                src={outfitImageUrl}
                alt="Outfit preview"
                className="w-16 h-16 rounded-lg object-cover shadow-sm"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  {outfitName || 'Your Outfit'}
                </p>
                <p className="text-sm text-gray-600">Ready to schedule</p>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span>When will you wear this? *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Occasion Field */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <span className="text-lg">🎉</span>
              <span>Occasion *</span>
            </label>
            <input
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g., Date Night, Work Meeting, Wedding"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Purchase Link (Optional) */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Item to Purchase (Optional)</span>
            </label>
            <input
              type="url"
              value={purchaseLink}
              onChange={(e) => setPurchaseLink(e.target.value)}
              placeholder="https://example.com/dress"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add a link to items you want to buy for this outfit
            </p>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="reminder"
              checked={needsReminder}
              onChange={(e) => setNeedsReminder(e.target.checked)}
              className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="reminder" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-2 font-medium text-gray-800">
                <Bell className="w-4 h-4" />
                <span>Remind me to buy this outfit</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Get a reminder before the scheduled date to purchase any items you need
              </p>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors shadow-md flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Save to Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveToCalendarModal;
