import { useState } from 'react';
import { ChevronLeft, Edit, Trash2, Calendar, MapPin, Users, Hotel, Plane } from 'lucide-react';
import { useTrip, useTripStats, useDeleteTrip, useTripDuration } from '../hooks/useTrips';
import { TRIP_TYPES, TRIP_STATUS, ACCOMMODATION_TYPES } from '../constants/tripTypes';
import { TripOverviewTab } from '../components/trips/TripOverviewTab';
import { TripPlanTab } from '../components/trips/TripPlanTab';
import { TripListTab } from '../components/trips/TripListTab';
import { TripInsightsTab } from '../components/trips/TripInsightsTab';
import { TripShoppingPanel } from '../components/trips/TripShoppingPanel';
import { TripRecommendationsBadge } from '../components/trips/TripRecommendationsBadge';

interface TripDetailPageProps {
  tripId: string;
  onBack: () => void;
  onEdit?: () => void;
}

type Tab = 'overview' | 'plan' | 'list' | 'insights';

export function TripDetailPage({ tripId, onBack, onEdit }: TripDetailPageProps) {
  const { data: trip, isLoading } = useTrip(tripId);
  const { data: stats } = useTripStats(tripId);
  const deleteTrip = useDeleteTrip();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  const duration = trip ? useTripDuration(trip.start_date, trip.end_date) : 0;
  const daysUntil = trip
    ? Math.ceil((new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleDelete = async () => {
    if (!trip) return;
    
    try {
      await deleteTrip.mutateAsync(tripId);
      onBack();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete trip');
    }
  };

  if (isLoading || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">{trip?.icon || '✈️'}</div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  const tripType = TRIP_TYPES[trip.trip_type];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-40">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Top Row: Back, Title, Actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">{trip.icon}</span>
              {trip.name}
            </h1>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Edit trip"
                >
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Delete trip"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Trip Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{trip.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{duration} days</span>
            </div>
            {trip.accommodation_type && (
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                <span>{ACCOMMODATION_TYPES[trip.accommodation_type]}</span>
              </div>
            )}
            {trip.number_of_travelers > 1 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{trip.number_of_travelers} travelers</span>
              </div>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                trip.status === 'planning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : trip.status === 'packed'
                  ? 'bg-green-100 text-green-800'
                  : trip.status === 'traveling'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {TRIP_STATUS[trip.status]}
            </span>
            {/* AI Recommendations Badge */}
            <TripRecommendationsBadge
              tripId={tripId}
              tripType={trip.trip_type}
              onClick={() => setShowShopping(true)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'plan'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Plan
              {stats && stats.totalActivities > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {stats.totalActivities}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              LIST
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="AI Insights"
            >
              <Plane className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <TripOverviewTab trip={trip} stats={stats} daysUntil={daysUntil} duration={duration} />
        )}
        {activeTab === 'plan' && <TripPlanTab trip={trip} />}
        {activeTab === 'list' && <TripListTab trip={trip} />}
        {activeTab === 'insights' && <TripInsightsTab trip={trip} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Trip?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{trip.name}"? This will also delete all activities, outfits, and
              packing list items. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTrip.isPending}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors"
              >
                {deleteTrip.isPending ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
