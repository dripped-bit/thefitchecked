import { useState, useEffect } from 'react';
import { Plane, Calendar, MapPin, ChevronLeft } from 'lucide-react';
import { useTrips, useTripDuration } from '../hooks/useTrips';
import authService from '../services/authService';
import { CreateTripModal } from '../components/trips/CreateTripModal';
import { TRIP_STATUS } from '../constants/tripTypes';

interface TripsListProps {
  onBack: () => void;
  onSelectTrip?: (tripId: string) => void;
}

export function TripsList({ onBack, onSelectTrip }: TripsListProps) {
  const [userId, setUserId] = useState<string>('');
  const { data: trips, isLoading } = useTrips(userId);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    };
    loadUser();
  }, []);

  const handleTripClick = (tripId: string) => {
    if (onSelectTrip) {
      onSelectTrip(tripId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-12 h-12 text-purple-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-40">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>

            {/* New Trip Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 transition-colors"
            >
              <span className="text-lg">+</span>
              New Trip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Trips Grid */}
        {trips && trips.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const duration = useTripDuration(trip.start_date, trip.end_date);
              const daysUntil = Math.ceil(
                (new Date(trip.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => handleTripClick(trip.id)}
                >
                  {/* Header with icon */}
                  <div
                    className="p-6 text-white"
                    style={{ backgroundColor: trip.color || '#805AD5' }}
                  >
                    <div className="text-5xl mb-2">{trip.icon || '✈️'}</div>
                    <h3 className="text-xl font-bold">{trip.name}</h3>
                    <p className="text-sm opacity-90">{trip.destination}</p>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-semibold">{duration} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Starts in</p>
                        <p className="font-semibold">
                          {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today!' : 'In progress'}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(trip.start_date).toLocaleDateString()} -{' '}
                      {new Date(trip.end_date).toLocaleDateString()}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              Create Your First Trip
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(tripId) => {
          console.log('✅ Trip created:', tripId);
          // Optionally navigate to trip detail
          if (onSelectTrip) {
            onSelectTrip(tripId);
          }
        }}
      />
    </div>
  );
}
