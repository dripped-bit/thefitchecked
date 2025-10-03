/**
 * Calendar Entry Modal
 * Modal for saving generated outfits to calendar with event details
 */

import React, { useState } from 'react';
import { X, Calendar, ShoppingBag, Bell, FileText } from 'lucide-react';
import smartCalendarService from '../services/smartCalendarService';
import { affiliateLinkService } from '../services/affiliateLinkService';

interface CalendarEntryModalProps {
  outfit: {
    outfit?: any;
    occasion?: string;
    image?: string;
    avatarUrl?: string;
    description?: string;
    imageUrl?: string;
    personality?: { name: string };
  };
  onSave: (calendarEntry: CalendarEntry) => void;
  onClose: () => void;
}

interface CalendarEntry {
  id: number;
  outfit: any;
  eventDate: string;
  occasion: string;
  shoppingLinks: string[];
  processedLinks?: ProcessedLink[];
  reminderDays: number;
  notes: string;
  createdAt: string;
  status: 'planned' | 'reminded' | 'completed';
}

interface ProcessedLink {
  url: string;
  store: string;
  affiliateUrl: string;
  isValid: boolean;
}

const CalendarEntryModal: React.FC<CalendarEntryModalProps> = ({
  outfit,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    eventDate: '',
    occasionName: outfit?.occasion || '',
    shoppingLinks: '',
    reminderDays: 7,
    notes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Get outfit image URL
  const getOutfitImage = () => {
    return outfit?.image || outfit?.avatarUrl || outfit?.imageUrl || '';
  };

  // Get outfit description
  const getOutfitDescription = () => {
    return outfit?.description || outfit?.personality?.name || 'Generated outfit';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [CALENDAR-MODAL] Form submitted:', formData);

    if (!formData.eventDate) {
      alert('Please select a date for your event');
      return;
    }

    setIsProcessing(true);

    try {
      // Process shopping links if provided
      let processedLinks: ProcessedLink[] = [];
      if (formData.shoppingLinks.trim()) {
        processedLinks = await processShoppingLinks(formData.shoppingLinks);
        console.log(`✅ [CALENDAR-MODAL] Processed ${processedLinks.length} shopping links`);
      }

      // Create calendar entry
      const calendarEntry: CalendarEntry = {
        id: Date.now(),
        outfit: outfit,
        eventDate: formData.eventDate,
        occasion: formData.occasionName,
        shoppingLinks: formData.shoppingLinks
          ? formData.shoppingLinks.split('\n').filter(l => l.trim())
          : [],
        processedLinks: processedLinks,
        reminderDays: formData.reminderDays,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: 'planned'
      };

      console.log('💾 [CALENDAR-MODAL] Saving calendar entry:', calendarEntry);

      // Save to calendar service
      await smartCalendarService.saveOutfitToCalendar({
        date: new Date(formData.eventDate),
        occasion: formData.occasionName,
        outfit: outfit,
        shoppingLinks: processedLinks.map(link => ({
          url: link.url,
          store: link.store,
          affiliateUrl: link.affiliateUrl
        }))
      });

      // Set up reminder if needed
      if (formData.reminderDays > 0) {
        scheduleReminder(calendarEntry);
      }

      console.log('✅ [CALENDAR-MODAL] Successfully saved to calendar');
      onSave(calendarEntry);
      onClose();

    } catch (error) {
      console.error('❌ [CALENDAR-MODAL] Error saving to calendar:', error);
      alert('Failed to save outfit to calendar. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process shopping links - validate and convert to affiliate links
   */
  const processShoppingLinks = async (linksText: string): Promise<ProcessedLink[]> => {
    const urls = linksText.split('\n').filter(l => l.trim());
    const processed: ProcessedLink[] = [];

    for (const url of urls) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      // Validate it's a product URL
      const isValid = smartCalendarService.isProductUrl(trimmedUrl);

      if (!isValid) {
        console.warn('⚠️ [CALENDAR-MODAL] Invalid product URL:', trimmedUrl);
      }

      // Detect store
      const store = affiliateLinkService.detectStoreFromUrl(trimmedUrl);

      // Convert to affiliate link
      const affiliateUrl = affiliateLinkService.convertToAffiliateLink(trimmedUrl, store);

      processed.push({
        url: trimmedUrl,
        store: store,
        affiliateUrl: affiliateUrl,
        isValid: isValid
      });
    }

    return processed;
  };

  /**
   * Schedule reminder for the outfit
   */
  const scheduleReminder = (entry: CalendarEntry) => {
    const eventDate = new Date(entry.eventDate);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - entry.reminderDays);

    console.log('🔔 [CALENDAR-MODAL] Reminder scheduled:', {
      eventDate: eventDate.toISOString(),
      reminderDate: reminderDate.toISOString(),
      daysBefore: entry.reminderDays
    });

    // Store reminder data in localStorage
    const reminders = JSON.parse(localStorage.getItem('outfit_reminders') || '[]');
    reminders.push({
      id: entry.id,
      reminderDate: reminderDate.toISOString(),
      eventDate: entry.eventDate,
      occasion: entry.occasion,
      message: `Don't forget to shop for your ${entry.occasion} outfit!`
    });
    localStorage.setItem('outfit_reminders', JSON.stringify(reminders));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Add to Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Outfit Preview */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex gap-4 items-start">
            {getOutfitImage() && (
              <img
                src={getOutfitImage()}
                alt="Outfit preview"
                className="w-24 h-32 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {getOutfitDescription()}
              </h3>
              <p className="text-sm text-gray-600">
                Save this outfit for your upcoming event
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Date */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Event Date *</span>
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Occasion Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Occasion Name</span>
            </label>
            <input
              type="text"
              value={formData.occasionName}
              onChange={(e) => setFormData({ ...formData, occasionName: e.target.value })}
              placeholder="e.g., Sarah's Birthday, Date Night, Work Conference..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Shopping Links */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Links (Optional)</span>
            </label>
            <textarea
              value={formData.shoppingLinks}
              onChange={(e) => setFormData({ ...formData, shoppingLinks: e.target.value })}
              placeholder="Paste product links here, one per line...&#10;https://www.amazon.com/dp/...&#10;https://www.fashionnova.com/products/..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add direct product links to purchase items for this outfit
            </p>
          </div>

          {/* Shopping Reminder */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Bell className="w-4 h-4" />
              <span>Shopping Reminder</span>
            </label>
            <select
              value={formData.reminderDays}
              onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>No reminder</option>
              <option value={3}>3 days before event</option>
              <option value={7}>1 week before event</option>
              <option value={14}>2 weeks before event</option>
              <option value={30}>1 month before event</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or styling tips..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEntryModal;
