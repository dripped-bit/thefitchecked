import { TrendingUp, Package, Calendar } from 'lucide-react';
import type { Trip, TripStats } from '../../hooks/useTrips';
import { TRIP_TYPES } from '../../constants/tripTypes';

interface TripOverviewTabProps {
  trip: Trip;
  stats?: TripStats;
  daysUntil: number;
  duration: number;
}

export function TripOverviewTab({ trip, stats, daysUntil, duration }: TripOverviewTabProps) {
  const tripType = TRIP_TYPES[trip.trip_type];

  /**
   * Calculate trip readiness based on:
   * - Outfit combos for each day (50% weight)
   * - Toiletries category checked (16.67% weight)
   * - Electronics category checked (16.67% weight)
   * - Documents category checked (16.67% weight)
   */
  const calculateTripReadiness = (): number => {
    if (!stats) return 0;

    let earnedPoints = 0;
    const totalPoints = 100;

    // 1. Outfit combos for each day (50% weight)
    const outfitsNeeded = duration; // One outfit per day
    const outfitsHave = stats.activitiesWithOutfits;
    const outfitScore = Math.min(outfitsHave / outfitsNeeded, 1) * 50;
    earnedPoints += outfitScore;

    // 2. Toiletries checked off (16.67% weight)
    if (stats.hasToiletries) {
      earnedPoints += 16.67;
    }

    // 3. Electronics checked off (16.67% weight)
    if (stats.hasElectronics) {
      earnedPoints += 16.67;
    }

    // 4. Documents checked off (16.67% weight)
    if (stats.hasDocuments) {
      earnedPoints += 16.67;
    }

    const readinessPercent = Math.round((earnedPoints / totalPoints) * 100);

    console.log('📊 [TRIP-READINESS] Calculating readiness...');
    console.log('📊 [TRIP-READINESS] Duration:', duration, 'days');
    console.log('📊 [TRIP-READINESS] Outfits:', outfitsHave, '/', outfitsNeeded, '=', Math.round(outfitScore), 'points');
    console.log('📊 [TRIP-READINESS] Toiletries:', stats.hasToiletries ? '✅ 16.67 pts' : '❌ 0 pts');
    console.log('📊 [TRIP-READINESS] Electronics:', stats.hasElectronics ? '✅ 16.67 pts' : '❌ 0 pts');
    console.log('📊 [TRIP-READINESS] Documents:', stats.hasDocuments ? '✅ 16.67 pts' : '❌ 0 pts');
    console.log('📊 [TRIP-READINESS] Final score:', readinessPercent, '%');

    return readinessPercent;
  };

  return (
    <div className="space-y-6">
      {/* Countdown Card */}
      <div
        className="rounded-2xl p-8 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${trip.color || '#805AD5'} 0%, ${trip.color || '#805AD5'}dd 100%)` }}
      >
        <div className="text-6xl mb-4">{trip.icon}</div>
        <h2 className="text-3xl font-bold mb-2">
          {daysUntil > 0 ? `${daysUntil} Days Until Trip` : daysUntil === 0 ? 'Trip Starts Today!' : 'Trip in Progress'}
        </h2>
        <p className="text-lg opacity-90">
          {duration} day trip to {trip.destination}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activities Stat */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalActivities || 0}</p>
              <p className="text-sm text-gray-600">Activities Planned</p>
            </div>
          </div>
          {stats && stats.activitiesWithOutfits > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {stats.activitiesWithOutfits} with outfits ({Math.round((stats.activitiesWithOutfits / stats.totalActivities) * 100)}%)
              </p>
            </div>
          )}
        </div>

        {/* Combined: Items Packed + Readiness */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Items Packed - Left Side */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPackingItems || 0}</p>
                <p className="text-sm text-gray-600">Items Packed</p>
              </div>
            </div>

            {/* Readiness - Right Side */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{calculateTripReadiness()}%</p>
                <p className="text-sm text-gray-600">Trip Readiness</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Trip Type</span>
            <span className="font-medium text-gray-900 flex items-center gap-2">
              {tripType.icon} {tripType.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dates</span>
            <span className="font-medium text-gray-900">
              {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium text-gray-900">{duration} days</span>
          </div>
          {trip.accommodation_type && (
            <div className="flex justify-between">
              <span className="text-gray-600">Accommodation</span>
              <span className="font-medium text-gray-900 capitalize">{trip.accommodation_type}</span>
            </div>
          )}
          {trip.number_of_travelers > 1 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Travelers</span>
              <span className="font-medium text-gray-900">{trip.number_of_travelers} people</span>
            </div>
          )}
          {trip.notes && (
            <div className="pt-3 border-t border-gray-100">
              <span className="text-gray-600 block mb-2">Notes</span>
              <p className="text-gray-900">{trip.notes}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
