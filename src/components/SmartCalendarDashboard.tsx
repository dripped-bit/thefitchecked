import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Cloud,
  Sun,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  Package,
  RefreshCw,
  Plus,
  X,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Star,
  Users,
  Plane,
  Camera
} from 'lucide-react';
import smartCalendarService, {
  CalendarEvent,
  OutfitPlan,
  MorningOptions,
  RepeatWarning,
  WeatherData,
  OutfitItem
} from '../services/smartCalendarService';
import PackingListGenerator from './PackingListGenerator';
import WoreThisTodayTracker from './WoreThisTodayTracker';

interface SmartCalendarDashboardProps {
  onBack?: () => void;
  clothingItems?: OutfitItem[];
}

const SmartCalendarDashboard: React.FC<SmartCalendarDashboardProps> = ({
  onBack,
  clothingItems = []
}) => {
  const [currentView, setCurrentView] = useState<'overview' | 'morning' | 'queue' | 'settings' | 'packing'>('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [morningOptions, setMorningOptions] = useState<MorningOptions | null>(null);
  const [outfitQueue, setOutfitQueue] = useState<OutfitPlan[]>([]);
  const [repeatWarnings, setRepeatWarnings] = useState<RepeatWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showOutfitPlanner, setShowOutfitPlanner] = useState(false);
  const [showWoreThisToday, setShowWoreThisToday] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    setIsLoading(true);
    try {
      const connected = smartCalendarService.isConnected();
      setIsConnected(connected);

      if (connected) {
        const events = await smartCalendarService.fetchUpcomingEvents();
        setUpcomingEvents(events);

        const queue = smartCalendarService.getOutfitQueue();
        setOutfitQueue(queue);
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalendarConnect = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const success = provider === 'google'
        ? await smartCalendarService.connectGoogleCalendar()
        : await smartCalendarService.connectAppleCalendar();

      if (success) {
        setIsConnected(true);
        await initializeDashboard();
      }
    } catch (error) {
      console.error('Calendar connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMorningOptions = async () => {
    setIsLoading(true);
    try {
      const options = await smartCalendarService.generateMorningOptions();
      setMorningOptions(options);
      setCurrentView('morning');
    } catch (error) {
      console.error('Failed to generate morning options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordOutfitWorn = (outfitItems: OutfitItem[], eventId?: string) => {
    smartCalendarService.recordOutfitWorn(outfitItems, eventId);

    // Refresh warnings and queue
    initializeDashboard();
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloudy':
      case 'partly_cloudy': return <Cloud className="w-5 h-5 text-gray-500" />;
      default: return <Cloud className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 border-blue-200',
      personal: 'bg-green-100 text-green-800 border-green-200',
      travel: 'bg-purple-100 text-purple-800 border-purple-200',
      formal: 'bg-gray-100 text-gray-800 border-gray-200',
      casual: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[eventType as keyof typeof colors] || colors.casual;
  };

  // =====================================
  // RENDER METHODS FOR DIFFERENT VIEWS
  // =====================================

  const renderConnectionSetup = () => (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Calendar</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Sync with your calendar to get intelligent outfit suggestions based on your events and weather.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => handleCalendarConnect('google')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Calendar className="w-5 h-5" />
          <span>Connect Google Calendar</span>
        </button>

        <button
          onClick={() => handleCalendarConnect('apple')}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <Calendar className="w-5 h-5" />
          <span>Connect Apple Calendar</span>
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>✓ We never store your calendar data permanently</p>
        <p>✓ Read-only access for outfit planning only</p>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={generateMorningOptions}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Morning Mode</span>
          </div>
          <p className="text-xs mt-1 opacity-90">3 outfit options for today</p>
        </button>

        <button
          onClick={() => setCurrentView('queue')}
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Outfit Queue</span>
          </div>
          <p className="text-xs mt-1 opacity-90">{outfitQueue.length} planned outfits</p>
        </button>

        <button
          onClick={() => setCurrentView('packing')}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span className="font-medium">Packing Lists</span>
          </div>
          <p className="text-xs mt-1 opacity-90">Smart travel planning</p>
        </button>

        <button
          onClick={() => setShowWoreThisToday(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span className="font-medium">Wore This Today</span>
          </div>
          <p className="text-xs mt-1 opacity-90">Track your outfit</p>
        </button>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Upcoming Events</h3>
          <button
            onClick={initializeDashboard}
            className="text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {upcomingEvents.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType}
                  </div>
                  <h4 className="font-medium text-gray-800">{event.title}</h4>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.startTime.toLocaleDateString()}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.weatherRequired && getWeatherIcon('partly_cloudy')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setShowOutfitPlanner(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Plan Outfit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repeat Warnings */}
      {repeatWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Outfit Repeat Warnings</h3>
          </div>
          <div className="space-y-2">
            {repeatWarnings.map((warning, index) => (
              <div key={index} className="text-sm text-yellow-700">
                <p>You wore a similar outfit {Math.floor((Date.now() - warning.lastWornDate.getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
                {warning.suggestion && <p className="text-yellow-600">💡 {warning.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMorningMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Good Morning! ☀️</h2>
        <p className="text-gray-600">Here are your personalized outfit options for today</p>
      </div>

      {morningOptions && (
        <div>
          {/* Weather Bar */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(morningOptions.weather.condition)}
                <div>
                  <p className="font-medium text-gray-800">{morningOptions.weather.temperature}°F</p>
                  <p className="text-sm text-gray-600">Feels like {morningOptions.weather.feels_like}°F</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Precipitation: {morningOptions.weather.precipitationChance}%</p>
                <p className="text-sm text-gray-600">UV Index: {morningOptions.weather.uvIndex}</p>
              </div>
            </div>
          </div>

          {/* Today's Events */}
          {morningOptions.todaysEvents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Today's Schedule</h3>
              <div className="space-y-2">
                {morningOptions.todaysEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium">{event.title}</span>
                    {event.location && (
                      <>
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{event.location}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outfit Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[morningOptions.option1, morningOptions.option2, morningOptions.option3].map((option, index) => (
              <div key={option.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
                <div className="text-center mb-4">
                  <div className="w-32 h-40 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 ml-2">Outfit {index + 1}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{option.confidence}% Match</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.notes}</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => recordOutfitWorn(option.outfitItems, option.eventId)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Wear This Today</span>
                    </div>
                  </button>

                  <div className="flex space-x-2">
                    <button className="flex-1 text-green-600 hover:bg-green-50 py-1 rounded transition-colors">
                      <ThumbsUp className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 text-red-600 hover:bg-red-50 py-1 rounded transition-colors">
                      <ThumbsDown className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Reasoning */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-800 mb-2">Why these suggestions?</h4>
            <ul className="space-y-1">
              {morningOptions.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentView('overview')}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Overview
        </button>
      </div>
    </div>
  );

  const renderOutfitQueue = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Outfit Queue</h2>
        <button
          onClick={() => setCurrentView('overview')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600 mb-4">Your planned outfits for the upcoming week</p>

        {outfitQueue.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No outfits planned yet</p>
            <button
              onClick={() => setCurrentView('overview')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Planning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {outfitQueue.map((plan) => (
              <div key={plan.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{plan.plannedDate.toDateString()}</h4>
                    <p className="text-sm text-gray-600 capitalize">{plan.occasion} • {plan.notes}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">{plan.confidence}% match</span>
                    <button
                      onClick={() => smartCalendarService.removeFromOutfitQueue(plan.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Calendar Settings</h2>
        <button
          onClick={() => setCurrentView('overview')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Connected Calendar</h3>
              <p className="text-sm text-gray-600">
                {isConnected
                  ? `Connected to ${smartCalendarService.getConnectedProvider()} Calendar`
                  : 'No calendar connected'
                }
              </p>
            </div>
            <button
              onClick={smartCalendarService.disconnect}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Disconnect
            </button>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => smartCalendarService.syncCalendar()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Calendar Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
              <span>Back to Closet</span>
            </button>
          )}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {renderConnectionSetup()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Smart Calendar</h1>
              <p className="text-gray-600">AI-powered outfit planning with calendar sync</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('settings')}
            className="text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            {isLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading calendar data...</p>
              </div>
            )}

            {!isLoading && currentView === 'overview' && renderOverview()}
            {!isLoading && currentView === 'morning' && renderMorningMode()}
            {!isLoading && currentView === 'queue' && renderOutfitQueue()}
            {!isLoading && currentView === 'settings' && renderSettings()}
            {!isLoading && currentView === 'packing' && (
              <PackingListGenerator
                onBack={() => setCurrentView('overview')}
                clothingItems={clothingItems}
              />
            )}
          </div>
        </div>
      </div>

      {/* Wore This Today Modal */}
      {showWoreThisToday && (
        <WoreThisTodayTracker
          onClose={() => setShowWoreThisToday(false)}
          clothingItems={clothingItems}
          todaysEvents={upcomingEvents.filter(e => {
            const today = new Date();
            const eventDate = new Date(e.startTime);
            return eventDate.toDateString() === today.toDateString();
          })}
        />
      )}
    </div>
  );
};

export default SmartCalendarDashboard;