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
  Camera,
  ShoppingBag
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
import AddEventModal from './AddEventModal';
import MonthlyCalendarGrid from './MonthlyCalendarGrid';
import OutfitSuggestionModal from './OutfitSuggestionModal';
import WeeklyOutfitQueue from './WeeklyOutfitQueue';
import CalendarConnectionSettings from './CalendarConnectionSettings';
import { calendarConnectionManager } from '../services/calendar/calendarConnectionManager';
import { GoogleCalendarConnection } from './calendar/GoogleCalendarConnection';
import { AppleCalendarConnection } from './calendar/AppleCalendarConnection';

interface SmartCalendarDashboardProps {
  onBack?: () => void;
  clothingItems?: OutfitItem[];
}

const SmartCalendarDashboard: React.FC<SmartCalendarDashboardProps> = ({
  onBack,
  clothingItems = []
}) => {
  const [currentView, setCurrentView] = useState<'calendar' | 'morning' | 'queue' | 'settings' | 'packing'>('calendar');
  const [isConnected, setIsConnected] = useState(false); // Any calendar connected
  const [googleConnected, setGoogleConnected] = useState(false); // Google calendar connection state
  const [googleEmail, setGoogleEmail] = useState<string | null>(null); // Google calendar email
  const [appleConnected, setAppleConnected] = useState(false); // Apple calendar connection state
  const [appleEmail, setAppleEmail] = useState<string | null>(null); // Apple calendar email
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [morningOptions, setMorningOptions] = useState<MorningOptions | null>(null);
  const [outfitQueue, setOutfitQueue] = useState<OutfitPlan[]>([]);
  const [repeatWarnings, setRepeatWarnings] = useState<RepeatWarning[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showOutfitPlanner, setShowOutfitPlanner] = useState(false);
  const [showWoreThisToday, setShowWoreThisToday] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [showOutfitSuggestions, setShowOutfitSuggestions] = useState(false);

  useEffect(() => {
    initializeDashboard();

    // Check for success message from OAuth callback
    const successMessage = sessionStorage.getItem('calendar_connection_success');
    if (successMessage) {
      alert(successMessage);
      sessionStorage.removeItem('calendar_connection_success');
      // Reload dashboard to reflect new connection
      initializeDashboard();
    }
  }, []);

  const initializeDashboard = async () => {
    setIsLoading(true);
    try {
      // Check if any calendar is connected (Google or Apple)
      const googleConnection = await calendarConnectionManager.getConnectionByProvider('google');
      const appleConnection = await calendarConnectionManager.getConnectionByProvider('apple');

      const googleIsConnected = googleConnection !== null;
      const appleIsConnected = appleConnection !== null;
      const anyConnected = googleIsConnected || appleIsConnected;

      console.log('📅 [SMART-CALENDAR] Connection status:', anyConnected ? 'Connected' : 'Not connected');
      console.log('📅 [SMART-CALENDAR] Google:', googleIsConnected ? 'Connected' : 'Not connected');
      console.log('📅 [SMART-CALENDAR] Apple:', appleIsConnected ? 'Not connected' : 'Not connected');

      setGoogleConnected(googleIsConnected);
      setGoogleEmail(googleConnection?.calendar_email || null);
      setAppleConnected(appleIsConnected);
      setAppleEmail(appleConnection?.calendar_email || null);
      setIsConnected(anyConnected);

      if (anyConnected) {
        const events = await smartCalendarService.fetchUpcomingEvents();
        setUpcomingEvents(events);

        const queue = smartCalendarService.getOutfitQueue();
        setOutfitQueue(queue);
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setIsConnected(false);
      setGoogleConnected(false);
      setGoogleEmail(null);
      setAppleConnected(false);
      setAppleEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = async (connected: boolean) => {
    console.log('📅 [SMART-CALENDAR] Connection changed:', connected);
    console.log('📅 [SMART-CALENDAR] Updating parent isConnected state to:', connected);
    setIsConnected(connected);
    if (connected) {
      console.log('📅 [SMART-CALENDAR] Re-initializing dashboard with new connection');
      await initializeDashboard();
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

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
        <GoogleCalendarConnection
          isConnected={googleConnected}
          calendarEmail={googleEmail}
          onConnectionChange={handleConnectionChange}
        />
        <AppleCalendarConnection
          isConnected={appleConnected}
          calendarEmail={appleEmail}
          onConnectionChange={handleConnectionChange}
        />
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>✓ We never store your calendar data permanently</p>
        <p>✓ Read-only access for outfit planning only</p>
      </div>
    </div>
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  const renderCalendarView = () => (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={generateMorningOptions}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 md:p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">Morning Mode</span>
          </div>
          <p className="text-xs mt-1 opacity-90 hidden md:block">3 outfit options for today</p>
        </button>

        <button
          onClick={() => setCurrentView('queue')}
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-3 md:p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">Outfit Queue</span>
          </div>
          <p className="text-xs mt-1 opacity-90 hidden md:block">{outfitQueue.length} planned outfits</p>
        </button>

        <button
          onClick={() => setCurrentView('packing')}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 md:p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">Packing Lists</span>
          </div>
          <p className="text-xs mt-1 opacity-90 hidden md:block">Smart travel planning</p>
        </button>

        <button
          onClick={() => setShowWoreThisToday(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 md:p-4 rounded-xl hover:scale-105 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-medium">Wore This</span>
          </div>
          <p className="text-xs mt-1 opacity-90 hidden md:block">Track your outfit</p>
        </button>
      </div>

      {/* Monthly Calendar Grid */}
      <MonthlyCalendarGrid
        events={upcomingEvents}
        onDateClick={handleDateClick}
        onAddEvent={() => setShowAddEventModal(true)}
        selectedDate={selectedDate}
      />

      {/* Date Details Panel (shows when date is clicked on mobile) */}
      {showDateDetails && selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowDateDetails(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setShowDateDetails(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Events for selected date */}
            <div className="space-y-3">
              {upcomingEvents.filter(e =>
                new Date(e.startTime).toDateString() === selectedDate.toDateString()
              ).map(event => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType}
                  </div>
                  <h4 className="font-medium text-gray-800">{event.title}</h4>
                  {event.location && (
                    <p className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowOutfitPlanner(true);
                      setShowDateDetails(false);
                    }}
                    className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Plan Outfit
                  </button>
                </div>
              ))}

              {upcomingEvents.filter(e =>
                new Date(e.startTime).toDateString() === selectedDate.toDateString()
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No events scheduled</p>
                  <div className="flex flex-col space-y-2 mt-3">
                    <button
                      onClick={() => {
                        setShowAddEventModal(true);
                        setShowDateDetails(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add Event
                    </button>
                    {clothingItems.length > 0 && (
                      <button
                        onClick={() => {
                          setShowOutfitSuggestions(true);
                          setShowDateDetails(false);
                        }}
                        className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Get AI Outfit Ideas</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
          onClick={() => setCurrentView('calendar')}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Calendar
        </button>
      </div>
    </div>
  );

  const renderOutfitQueue = () => (
    <WeeklyOutfitQueue
      onBack={() => setCurrentView('calendar')}
      clothingItems={clothingItems}
      events={upcomingEvents}
      onPlanOutfit={(date, event) => {
        setSelectedDate(date);
        setSelectedEvent(event || null);
        setShowOutfitSuggestions(true);
      }}
    />
  );

  const handleGoogleCalendarSync = async (events: CalendarEvent[]) => {
    // Save synced events to local state and Supabase
    setUpcomingEvents(prevEvents => {
      // Merge Google events with existing events
      const googleEventIds = events.map(e => e.id);
      const nonGoogleEvents = prevEvents.filter(e => !e.id.startsWith('google_'));
      return [...nonGoogleEvents, ...events];
    });

    console.log(`✅ Synced ${events.length} events from Google Calendar`);
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Calendar Settings</h2>
        <button
          onClick={() => setCurrentView('calendar')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <CalendarConnectionSettings
        onSync={handleGoogleCalendarSync}
      />
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

            {!isLoading && currentView === 'calendar' && renderCalendarView()}
            {!isLoading && currentView === 'morning' && renderMorningMode()}
            {!isLoading && currentView === 'queue' && renderOutfitQueue()}
            {!isLoading && currentView === 'settings' && renderSettings()}
            {!isLoading && currentView === 'packing' && (
              <PackingListGenerator
                onBack={() => setCurrentView('calendar')}
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

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onEventCreated={() => {
          initializeDashboard();
          setShowAddEventModal(false);
        }}
      />

      {/* Outfit Suggestion Modal */}
      {showOutfitSuggestions && selectedDate && (
        <OutfitSuggestionModal
          date={selectedDate}
          event={selectedEvent || undefined}
          clothingItems={clothingItems}
          onClose={() => setShowOutfitSuggestions(false)}
          onSelectOutfit={(suggestion) => {
            console.log('Selected outfit:', suggestion);
            // TODO: Save outfit plan to calendar
            setShowOutfitSuggestions(false);
          }}
        />
      )}
    </div>
  );
};

export default SmartCalendarDashboard;