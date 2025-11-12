import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Tag, FileText } from 'lucide-react';
import smartCalendarService from '../services/smartCalendarService';
import { glassModalClasses } from '../styles/glassEffects';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
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
    weatherRequired: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

      // Create event
      const event = await smartCalendarService.createEvent({
        title: formData.title,
        description: formData.description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location || undefined,
        eventType: formData.eventType,
        isAllDay: formData.isAllDay,
        weatherRequired: formData.weatherRequired
      });

      if (event) {
        console.log('✅ Event created successfully:', event.id);
        onEventCreated();
        handleClose();
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error creating event:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      eventType: 'personal',
      isAllDay: false,
      weatherRequired: false
    });
    setError(null);
    onClose();
  };

  // Set default dates (today)
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <div className="fixed inset-0 ios-blur bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="ios-card ios-slide-up max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-ios-separator px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-ios-purple to-ios-blue rounded-full flex items-center justify-center shadow-ios-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="ios-large-title">Add Calendar Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-ios-fill rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ios-label-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios-lg p-4">
              <p className="text-ios-red ios-callout font-semibold">{error}</p>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block ios-subheadline font-semibold mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Team Meeting, Dinner with Friends"
              className="ios-input w-full"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block ios-subheadline font-semibold mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Event Type *
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

          {/* Date and Time - Start */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block ios-subheadline font-semibold mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate || today}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="ios-input w-full"
                required
              />
            </div>
            <div>
              <label className="block ios-subheadline font-semibold mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime || now}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="ios-input w-full"
                required
              />
            </div>
          </div>

          {/* Date and Time - End */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block ios-subheadline font-semibold mb-2">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="ios-input w-full"
              />
            </div>
            <div>
              <label className="block ios-subheadline font-semibold mb-2">
                End Time (optional)
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
            <label className="block ios-subheadline font-semibold mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Conference Room A, Central Park"
              className="ios-input w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block ios-subheadline font-semibold mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this event..."
              rows={3}
              className="ios-input w-full resize-none"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                className="w-5 h-5 text-ios-blue rounded focus:ring-ios-blue"
              />
              <span className="ios-callout">All-day event</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.weatherRequired}
                onChange={(e) => setFormData({ ...formData, weatherRequired: e.target.checked })}
                className="w-5 h-5 text-ios-blue rounded focus:ring-ios-blue"
              />
              <span className="ios-callout">
                Weather-dependent (outdoor event)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-ios-separator">
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
              {isSaving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
