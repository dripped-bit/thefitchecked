import { TrendingUp, CheckCircle2, Package, Calendar } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Packing Stat */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.packedItems || 0}/{stats?.totalPackingItems || 0}</p>
              <p className="text-sm text-gray-600">Items Packed</p>
            </div>
          </div>
          {stats && stats.totalPackingItems > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.packingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Readiness Stat */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalActivities && stats.totalPackingItems
                  ? Math.round(((stats.activitiesWithOutfits + stats.packedItems) / (stats.totalActivities + stats.totalPackingItems)) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Trip Readiness</p>
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

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="space-y-2">
          {(!stats || stats.totalActivities === 0) && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Plan Your Daily Activities</p>
                <p className="text-sm text-gray-600">Go to the Daily Plan tab to add activities for each day</p>
              </div>
            </div>
          )}
          {stats && stats.totalActivities > 0 && stats.activitiesWithOutfits < stats.totalActivities && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Plan Outfits for Activities</p>
                <p className="text-sm text-gray-600">
                  {stats.totalActivities - stats.activitiesWithOutfits} activities need outfits
                </p>
              </div>
            </div>
          )}
          {(!stats || stats.totalPackingItems === 0) && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Generate Packing List</p>
                <p className="text-sm text-gray-600">Go to the Packing List tab to auto-generate items from your outfits</p>
              </div>
            </div>
          )}
          {stats && stats.totalPackingItems > 0 && stats.packedItems < stats.totalPackingItems && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Pack Your Items</p>
                <p className="text-sm text-gray-600">
                  {stats.totalPackingItems - stats.packedItems} items left to pack
                </p>
              </div>
            </div>
          )}
          {stats && stats.packedItems === stats.totalPackingItems && stats.totalPackingItems > 0 && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">All Packed!</p>
                <p className="text-sm text-gray-600">You're ready for your trip 🎉</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
