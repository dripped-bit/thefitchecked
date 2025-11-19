import { useState } from 'react';
import { Plus, Clock, MapPin, Star, Trash2, Sparkles } from 'lucide-react';
import { useTripActivities, useTripDaysArray, useDeleteActivity, useTripOutfit } from '../../hooks/useTrips';
import { PlanActivityModal } from './PlanActivityModal';
import { TripOutfitPlanningModal } from './TripOutfitPlanningModal';
import { ACTIVITY_ICONS, TIME_SLOT_LABELS, FORMALITY_LEVELS } from '../../constants/tripTypes';
import type { Trip, TripActivity } from '../../hooks/useTrips';
import type { TimeSlot } from '../../constants/tripTypes';

interface TripDailyPlanTabProps {
  trip: Trip;
}

export function TripDailyPlanTab({ trip }: TripDailyPlanTabProps) {
  const { data: activities = [] } = useTripActivities(trip.id);
  const deleteActivity = useDeleteActivity();
  const tripDays = useTripDaysArray(trip.start_date, trip.end_date);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TripActivity | null>(null);

  const handleAddActivity = (date: string, timeSlot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setShowAddModal(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (confirm('Delete this activity?')) {
      try {
        await deleteActivity.mutateAsync(activityId);
      } catch (error) {
        console.error('Failed to delete activity:', error);
        alert('Failed to delete activity');
      }
    }
  };

  const handlePlanOutfit = (activity: TripActivity) => {
    setSelectedActivity(activity);
    setShowOutfitModal(true);
  };

  // Group activities by date
  const activitiesByDate = tripDays.map((day) => {
    const dateStr = day.toISOString().split('T')[0];
    const dayActivities = activities.filter((a) => a.date === dateStr);
    
    // Group by time slot
    const morning = dayActivities.filter((a) => a.time_slot === 'morning');
    const afternoon = dayActivities.filter((a) => a.time_slot === 'afternoon');
    const evening = dayActivities.filter((a) => a.time_slot === 'evening');

    return {
      date: day,
      dateStr,
      morning,
      afternoon,
      evening,
      total: dayActivities.length,
    };
  });

  if (tripDays.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Days Available</h3>
        <p className="text-gray-600">Check your trip dates</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Activity Planner</h3>
        <p className="text-gray-600 text-sm">
          Plan your activities for each day and time slot. Click the + button to add activities, then plan outfits for each one.
        </p>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {activitiesByDate.map(({ date, dateStr, morning, afternoon, evening, total }) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const dateDisplay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

          return (
            <div key={dateStr} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Day Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold">{dayName}</h4>
                    <p className="text-sm opacity-90">{dateDisplay}</p>
                  </div>
                  {total > 0 && (
                    <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {total} {total === 1 ? 'activity' : 'activities'}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <div className="divide-y divide-gray-100">
                {/* Morning */}
                <TimeSlotSection
                  timeSlot="morning"
                  activities={morning}
                  onAdd={() => handleAddActivity(dateStr, 'morning')}
                  onDelete={handleDeleteActivity}
                  onPlanOutfit={handlePlanOutfit}
                />

                {/* Afternoon */}
                <TimeSlotSection
                  timeSlot="afternoon"
                  activities={afternoon}
                  onAdd={() => handleAddActivity(dateStr, 'afternoon')}
                  onDelete={handleDeleteActivity}
                  onPlanOutfit={handlePlanOutfit}
                />

                {/* Evening */}
                <TimeSlotSection
                  timeSlot="evening"
                  activities={evening}
                  onAdd={() => handleAddActivity(dateStr, 'evening')}
                  onDelete={handleDeleteActivity}
                  onPlanOutfit={handlePlanOutfit}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Activity Modal */}
      <PlanActivityModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedDate(undefined);
          setSelectedTimeSlot(undefined);
        }}
        tripId={trip.id}
        startDate={trip.start_date}
        endDate={trip.end_date}
        preselectedDate={selectedDate}
        preselectedTimeSlot={selectedTimeSlot}
      />

      {/* Outfit Planning Modal */}
      {selectedActivity && (
        <TripOutfitPlanningModal
          isOpen={showOutfitModal}
          onClose={() => {
            setShowOutfitModal(false);
            setSelectedActivity(null);
          }}
          activity={selectedActivity}
          trip={trip}
        />
      )}
    </div>
  );
}

// Time Slot Section Component
interface TimeSlotSectionProps {
  timeSlot: TimeSlot;
  activities: TripActivity[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onPlanOutfit: (activity: TripActivity) => void;
}

function TimeSlotSection({ timeSlot, activities, onAdd, onDelete, onPlanOutfit }: TimeSlotSectionProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-700">{TIME_SLOT_LABELS[timeSlot]}</span>
        </div>
        <button
          onClick={onAdd}
          className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
          title="Add activity"
        >
          <Plus className="w-5 h-5 text-purple-600" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No activities planned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              onDelete={onDelete}
              onPlanOutfit={onPlanOutfit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Activity Card Component
interface ActivityCardProps {
  activity: TripActivity;
  onDelete: (id: string) => void;
  onPlanOutfit: (activity: TripActivity) => void;
}

function ActivityCard({ activity, onDelete, onPlanOutfit }: ActivityCardProps) {
  const { data: outfit } = useTripOutfit(activity.id);
  const activityIcon = activity.activity_type ? ACTIVITY_ICONS[activity.activity_type] : '📍';
  const formalityInfo = activity.formality_level ? FORMALITY_LEVELS[activity.formality_level - 1] : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0">{activityIcon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-gray-900 mb-1">{activity.title}</h5>
          
          {activity.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}

          {formalityInfo && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Star className="w-3 h-3" />
              <span>{formalityInfo.label}</span>
            </div>
          )}

          {activity.notes && (
            <p className="text-sm text-gray-600 mb-2">{activity.notes}</p>
          )}

          {/* Outfit Status */}
          {outfit ? (
            <button
              onClick={() => onPlanOutfit(activity)}
              className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Outfit planned - Edit</span>
            </button>
          ) : (
            <button
              onClick={() => onPlanOutfit(activity)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Plan outfit
            </button>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(activity.id)}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Delete activity"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
}
