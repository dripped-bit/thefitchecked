import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateActivity, useTripDaysArray } from '../../hooks/useTrips';
import { ACTIVITY_ICONS, TIME_SLOT_LABELS, FORMALITY_LEVELS } from '../../constants/tripTypes';
import type { TimeSlot, ActivityType, FormalityLevel } from '../../constants/tripTypes';

interface PlanActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  startDate: string;
  endDate: string;
  preselectedDate?: string;
  preselectedTimeSlot?: TimeSlot;
}

export function PlanActivityModal({
  isOpen,
  onClose,
  tripId,
  startDate,
  endDate,
  preselectedDate,
  preselectedTimeSlot,
}: PlanActivityModalProps) {
  const createActivity = useCreateActivity();
  const tripDays = useTripDaysArray(startDate, endDate);

  const [formData, setFormData] = useState({
    date: preselectedDate || tripDays[0]?.toISOString().split('T')[0] || '',
    time_slot: preselectedTimeSlot || ('morning' as TimeSlot),
    activity_type: '' as ActivityType | '',
    title: '',
    location: '',
    formality_level: 3 as FormalityLevel,
    weather_consideration: true,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await createActivity.mutateAsync({
        trip_id: tripId,
        date: formData.date,
        time_slot: formData.time_slot,
        activity_type: formData.activity_type || undefined,
        title: formData.title,
        location: formData.location || undefined,
        formality_level: formData.formality_level,
        weather_consideration: formData.weather_consideration,
        notes: formData.notes || undefined,
      });

      console.log('✅ Activity created');
      
      // Reset form
      setFormData({
        date: preselectedDate || tripDays[0]?.toISOString().split('T')[0] || '',
        time_slot: preselectedTimeSlot || 'morning',
        activity_type: '',
        title: '',
        location: '',
        formality_level: 3,
        weather_consideration: true,
        notes: '',
      });

      onClose();
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Plan Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <select
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {tripDays.map((day) => {
                  const dateStr = day.toISOString().split('T')[0];
                  return (
                    <option key={dateStr} value={dateStr}>
                      {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot *</label>
              <select
                required
                value={formData.time_slot}
                onChange={(e) => setFormData({ ...formData, time_slot: e.target.value as TimeSlot })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Object.entries(TIME_SLOT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Activity Type</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(ACTIVITY_ICONS).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity_type: key as ActivityType })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.activity_type === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={key}
                >
                  <div className="text-2xl">{icon}</div>
                  <div className="text-xs mt-1 capitalize">{key}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Visit Eiffel Tower, Beach Day, Business Meeting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Champ de Mars, Santa Monica Beach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Formality Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formality Level: {FORMALITY_LEVELS[formData.formality_level - 1].label}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.formality_level}
              onChange={(e) => setFormData({ ...formData, formality_level: parseInt(e.target.value) as FormalityLevel })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Casual</span>
              <span>Casual</span>
              <span>Smart Casual</span>
              <span>Business</span>
              <span>Formal</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {FORMALITY_LEVELS[formData.formality_level - 1].description}
            </p>
          </div>

          {/* Weather Consideration */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.weather_consideration}
                onChange={(e) => setFormData({ ...formData, weather_consideration: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Consider weather when suggesting outfits</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special considerations, dress codes, or reminders..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createActivity.isPending}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createActivity.isPending ? 'Creating...' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
