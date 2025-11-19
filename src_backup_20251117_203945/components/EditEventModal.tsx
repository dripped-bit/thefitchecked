import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Tag, FileText, Bell, ShoppingBag, ExternalLink } from 'lucide-react';
import smartCalendarService, { CalendarEvent } from '../services/smartCalendarService';
import { glassModalClasses } from '../styles/glassEffects';

interface EditEventModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEventUpdated: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, event, onClose, onEventUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    eventType: 'personal' as 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other',
    isAllDay: false,
    weatherRequired: false,
    reminderMinutes: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location || '',
        eventType: event.eventType,
        isAllDay: event.isAllDay,
        weatherRequired: event.weatherRequired || false,
        reminderMinutes: 0, // Default, can be enhanced to read from event
      });
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!formData.startDate || !formData.startTime) {
      setError('Start date and time are required');
      return;
    }

    try {
      setIsSaving(true);

      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      let endDateTime: Date;

      if (formData.endDate && formData.endTime) {
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      } else {
        // Default: 1 hour after start
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      }

      // Update event
      const updatedEvent = await smartCalendarService.updateEvent(event.id, {
        title: formData.title,
        description: formData.description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location || undefined,
        eventType: formData.eventType,
        isAllDay: formData.isAllDay,
        weatherRequired: formData.weatherRequired,
        reminderMinutes: formData.reminderMinutes > 0 ? formData.reminderMinutes : undefined,
      });

      if (updatedEvent) {
        console.log('✅ Event updated successfully:', updatedEvent.id);
        onEventUpdated();
        handleClose();
      } else {
        setError('Failed to update event. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 ios-blur bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="ios-card ios-slide-up w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ios-separator">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-ios-blue" />
            <h2 className="ios-large-title">Edit Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-ios-fill rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-ios-label-tertiary" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-ios-red/10 border border-ios-red/20 rounded-ios-lg text-ios-red ios-callout">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Title */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <Tag className="w-4 h-4" />
              <span>Event Title *</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Dinner with Friends, Work Meeting..."
              required
              className="ios-input w-full"
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
                <Calendar className="w-4 h-4" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="ios-input w-full"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
                <Clock className="w-4 h-4" />
                <span>Start Time *</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="ios-input w-full"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
                <Calendar className="w-4 h-4" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="ios-input w-full"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
                <Clock className="w-4 h-4" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="ios-input w-full"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Downtown Restaurant, Conference Room..."
              className="ios-input w-full"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <Tag className="w-4 h-4" />
              <span>Event Type</span>
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
              className="ios-input w-full"
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="travel">Travel</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Reminder */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <Bell className="w-4 h-4" />
              <span>Reminder</span>
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) => setFormData({ ...formData, reminderMinutes: Number(e.target.value) })}
              className="ios-input w-full"
            >
              <option value={0}>No reminder</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
              <option value={2880}>2 days before</option>
              <option value={10080}>1 week before</option>
            </select>
          </div>

          {/* Description/Notes */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <FileText className="w-4 h-4" />
              <span>Outfit Details / Notes</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your outfit or add styling notes..."
              rows={4}
              className="ios-input w-full resize-none"
            />
          </div>

          {/* Shopping Links Display (Read-only for now) */}
          {event.shoppingLinks && event.shoppingLinks.length > 0 && (
            <div>
              <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Shopping Links</span>
              </label>
              <div className="space-y-2">
                {event.shoppingLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.affiliateUrl || link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-ios-blue/10 hover:bg-ios-blue/20 rounded-ios-lg border border-ios-blue/20 transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <ShoppingBag className="w-4 h-4 text-ios-blue flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="ios-callout font-semibold text-ios-blue truncate">
                          {link.title || link.store}
                        </p>
                        {link.price && (
                          <p className="ios-caption-1 text-ios-blue">{link.price}</p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-ios-blue flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.weatherRequired}
                onChange={(e) => setFormData({ ...formData, weatherRequired: e.target.checked })}
                className="w-4 h-4 text-ios-blue border-gray-300 rounded focus:ring-ios-blue"
              />
              <span className="ios-callout">Track weather for this event</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="ios-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="ios-button-primary flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
