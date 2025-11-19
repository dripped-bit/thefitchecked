import React, { useState, useEffect } from 'react';
import { getSmartImageUrl } from '../services/imageUtils';
import { X, Calendar, Check, Plus, ShoppingBag, Bell } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';
import brandTrackingService from '../services/brandTrackingService';
import { pushNotificationService } from '../services/pushNotificationService';

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
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [shoppingLinks, setShoppingLinks] = useState<string[]>([]);
  const [existingEvent, setExistingEvent] = useState<any>(null);
  
  // Notification settings
  const [reminderDays, setReminderDays] = useState<number>(7);
  const [getReadyReminderHours, setGetReadyReminderHours] = useState<number>(2);
  const [useCustomReminder, setUseCustomReminder] = useState(false);

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchExistingOutfit();
      fetchSavedOutfits();
    }
  }, [isOpen, selectedDate]);

  const fetchExistingOutfit = async () => {
    setLoadingExisting(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      
      console.log('🔍 [MODAL] Fetching existing outfit for date:', dateStr);
      
      // Query calendar_events for this date
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lt('start_time', `${dateStr}T23:59:59`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [MODAL] Error fetching existing outfit:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ [MODAL] Found existing event:', data);
        console.log('🛍️ [MODAL] Shopping links:', {
          count: data.shopping_links?.length || 0,
          links: data.shopping_links,
          outfitImageUrl: data.outfit_image_url
        });
        setExistingEvent(data);
        // Prefill form fields
        setOccasion(data.title || '');
        setNotes(data.description || '');
        setEventLocation(data.location || '');
        setShoppingLinks(data.shopping_links || []);
        if (data.outfit_id) {
          setSelectedOutfit(data.outfit_id);
        }
        
        // Load existing reminder settings
        if (data.reminder_minutes) {
          const reminderDaysCalc = Math.floor(data.reminder_minutes / (24 * 60));
          setReminderDays(reminderDaysCalc);
        }
      } else {
        console.log('📝 [MODAL] No existing event found for this date');
        // Reset form for new entry
        setExistingEvent(null);
        setOccasion('');
        setNotes('');
        setEventLocation('');
        setShoppingLinks([]);
        setSelectedOutfit(null);
      }
    } catch (error) {
      console.error('❌ [MODAL] Error fetching existing outfit:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

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

  const handleOpenShoppingLink = async (link: any) => {
    try {
      const url = link.affiliateUrl || link.url;
      const store = link.store || 'Shopping';
      
      console.log('🛍️ [CALENDAR] Opening shopping link:', store);

      // Track click
      if (existingEvent?.id) {
        const user = await authService.getCurrentUser();
        if (user) {
          await brandTrackingService.trackShoppingLinkClick({
            userId: user.id,
            eventId: existingEvent.id.toString(),
            productUrl: url,
            productTitle: link.title || 'Product',
            store: store,
            price: link.price,
            source: 'calendar'
          });
        }
      }

      // Open in in-app browser
      await Browser.open({
        url: url,
        presentationStyle: 'popover',
        toolbarColor: '#000000'
      });

      // Listen for browser close to detect potential purchase
      Browser.addListener('browserFinished', async () => {
        console.log('🔙 [CALENDAR] User returned from shopping');
        
        // Track that user returned (potential purchase signal)
        if (existingEvent?.id) {
          const user = await authService.getCurrentUser();
          if (user) {
            await brandTrackingService.trackBrowserReturn({
              userId: user.id,
              eventId: existingEvent.id.toString(),
              productUrl: url,
              store: store,
              timeSpent: Date.now()
            });
          }
        }
      });

    } catch (error) {
      console.error('❌ [CALENDAR] Error opening shopping link:', error);
    }
  };

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const scheduledDate = selectedDate.toISOString();
      const reminderMinutes = reminderDays * 24 * 60;

      // Prepare event data
      const eventData = {
        user_id: user.id,
        title: occasion || 'Scheduled Outfit',
        description: notes || null,
        start_time: scheduledDate,
        end_time: scheduledDate,
        location: eventLocation || null,
        outfit_id: selectedOutfit || null,
        shopping_links: shoppingLinks.length > 0 ? shoppingLinks : null,
        event_type: 'outfit',
        is_all_day: true,
        weather_required: false,
        reminder_minutes: reminderMinutes > 0 ? reminderMinutes : null
      };

      if (existingEvent) {
        // UPDATE existing event
        console.log('📝 [MODAL] Updating existing event:', existingEvent.id);
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', existingEvent.id);

        if (error) throw error;

        // Cancel old notifications
        try {
          await pushNotificationService.cancelNotification(`shopping-${existingEvent.id}`);
          await pushNotificationService.cancelNotification(`getready-${existingEvent.id}`);
        } catch (notifError) {
          console.warn('⚠️ [MODAL] Could not cancel old notifications:', notifError);
        }

        // Schedule new shopping reminder
        if (reminderDays > 0 && shoppingLinks.length > 0) {
          try {
            await pushNotificationService.scheduleOutfitReminder(
              {
                id: existingEvent.id.toString(),
                date: scheduledDate,
                occasion: occasion || 'Scheduled Outfit',
                shoppingLinks: shoppingLinks
              },
              reminderDays
            );
            console.log('🔔 [MODAL] Shopping reminder scheduled');
          } catch (notifError) {
            console.warn('⚠️ [MODAL] Could not schedule shopping reminder:', notifError);
          }
        }

        // Schedule new get-ready reminder
        if (getReadyReminderHours > 0) {
          try {
            const eventDateTime = new Date(scheduledDate);
            const reminderTime = new Date(eventDateTime.getTime() - (getReadyReminderHours * 60 * 60 * 1000));

            await pushNotificationService.scheduleNotification({
              title: `Get Ready: ${occasion || 'Outfit'}`,
              body: `Time to prepare your outfit!`,
              id: `getready-${existingEvent.id}`,
              schedule: { at: reminderTime }
            });
            console.log('🔔 [MODAL] Get ready reminder scheduled');
          } catch (notifError) {
            console.warn('⚠️ [MODAL] Could not schedule get-ready reminder:', notifError);
          }
        }

        console.log('✅ [MODAL] Event updated successfully with notifications');
      } else {
        // INSERT new event
        console.log('📝 [MODAL] Creating new event');
        const { data, error } = await supabase
          .from('calendar_events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        const newEventId = data.id;

        // Schedule shopping reminder for new event
        if (reminderDays > 0 && shoppingLinks.length > 0) {
          try {
            await pushNotificationService.scheduleOutfitReminder(
              {
                id: newEventId.toString(),
                date: scheduledDate,
                occasion: occasion || 'Scheduled Outfit',
                shoppingLinks: shoppingLinks
              },
              reminderDays
            );
            console.log('🔔 [MODAL] Shopping reminder scheduled');
          } catch (notifError) {
            console.warn('⚠️ [MODAL] Could not schedule shopping reminder:', notifError);
          }
        }

        // Schedule get-ready reminder for new event
        if (getReadyReminderHours > 0) {
          try {
            const eventDateTime = new Date(scheduledDate);
            const reminderTime = new Date(eventDateTime.getTime() - (getReadyReminderHours * 60 * 60 * 1000));

            await pushNotificationService.scheduleNotification({
              title: `Get Ready: ${occasion || 'Outfit'}`,
              body: `Time to prepare your outfit!`,
              id: `getready-${newEventId}`,
              schedule: { at: reminderTime }
            });
            console.log('🔔 [MODAL] Get ready reminder scheduled');
          } catch (notifError) {
            console.warn('⚠️ [MODAL] Could not schedule get-ready reminder:', notifError);
          }
        }

        console.log('✅ [MODAL] Event created successfully with notifications');
      }

      onOutfitScheduled();
      onClose();
    } catch (error) {
      console.error('❌ [MODAL] Error scheduling outfit:', error);
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="border-b border-gray-200 flex items-center justify-between flex-shrink-0"
          style={{
            padding: '16px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))'
          }}
        >
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
          {/* Existing Event Banner */}
          {existingEvent && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900">✓ Existing Outfit Scheduled</p>
                  <p className="text-sm text-blue-700">{existingEvent.title}</p>
                  {existingEvent.location && (
                    <p className="text-xs text-blue-600 mt-1">📍 {existingEvent.location}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Clear existing and start fresh
                    setExistingEvent(null);
                    setOccasion('');
                    setNotes('');
                    setEventLocation('');
                    setShoppingLinks([]);
                    setSelectedOutfit(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingExisting && (
            <div className="text-center py-4 text-gray-500">
              <p>Loading existing outfit...</p>
            </div>
          )}

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
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    // TODO: Open outfit creator/selector
                    console.log('Add outfit clicked');
                  }}
                  className="w-48 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all flex flex-col items-center justify-center space-y-2"
                >
                  <Plus className="w-12 h-12 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Add Outfit</span>
                </button>
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
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., Downtown Office, Central Park"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Shopping Links Display - Show existing links with images */}
            {existingEvent?.shopping_links && existingEvent.shopping_links.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                  Shopping Links ({existingEvent.shopping_links.length})
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {existingEvent.shopping_links.map((link: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleOpenShoppingLink(link)}
                      className="block rounded-lg overflow-hidden border border-gray-200 hover:border-pink-400 transition-all hover:shadow-lg text-left w-full"
                    >
                      {/* Product Image */}
                      {(link.image || link.imageUrl) && (
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={link.image || link.imageUrl}
                            alt={link.title || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Product Info */}
                      <div className="p-3 bg-white">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {link.title || 'Shopping Item'}
                        </p>
                        {link.store && (
                          <p className="text-xs text-gray-500 mt-1">
                            {link.store}
                          </p>
                        )}
                        {link.price && (
                          <p className="text-sm font-bold text-pink-600 mt-1">
                            {link.price}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          Shop Now →
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Settings */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminder Settings
              </h3>

              {/* Shopping Reminder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shopping Reminder
                </label>
                <select
                  value={reminderDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setUseCustomReminder(true);
                    } else {
                      setReminderDays(Number(value));
                      setUseCustomReminder(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                >
                  <option value={0}>No reminder</option>
                  <option value={1}>1 day before event</option>
                  <option value={3}>3 days before event</option>
                  <option value={7}>1 week before event</option>
                  <option value={14}>2 weeks before event</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>

              {/* Get Ready Reminder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Get Ready Reminder
                </label>
                <select
                  value={getReadyReminderHours}
                  onChange={(e) => setGetReadyReminderHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: '16px' }}
                >
                  <option value={0}>No reminder</option>
                  <option value={1}>1 hour before event</option>
                  <option value={2}>2 hours before event</option>
                  <option value={3}>3 hours before event</option>
                  <option value={4}>4 hours before event</option>
                  <option value={6}>6 hours before event</option>
                </select>
              </div>

              {/* Show current reminder status if exists */}
              {existingEvent?.reminder_minutes > 0 && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Current: Reminder set for {Math.floor(existingEvent.reminder_minutes / (24 * 60))} days before
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shopping Links (optional)
              </label>
              <textarea
                value={shoppingLinks.join('\n')}
                onChange={(e) => setShoppingLinks(e.target.value.split('\n').filter(l => l.trim()))}
                placeholder="Paste shopping URLs, one per line"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ fontSize: '16px' }}
              />
              {shoppingLinks.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  🛍️ {shoppingLinks.length} link{shoppingLinks.length !== 1 ? 's' : ''} added
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any styling tips, outfit notes, or reminders..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ fontSize: '16px' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Shopping links are displayed above and saved separately
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pb-6 border-t border-gray-200 flex space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!selectedOutfit || loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Scheduling...' : 'Schedule Outfit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOutfitModal;
