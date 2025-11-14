import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
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
  ShoppingBag,
  ExternalLink,
  FileText,
  Bell,
  PenLine,
  Luggage,
  Sunrise,
  User
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
import EditEventModal from './EditEventModal';
import MonthlyCalendarGrid from './MonthlyCalendarGrid';
import EnhancedMonthlyCalendarGrid from './EnhancedMonthlyCalendarGrid';
import OutfitSuggestionModal from './OutfitSuggestionModal';
import WeeklyOutfitQueue from './WeeklyOutfitQueue';
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
  const [isLoading, setIsLoading] = useState(true); // Start as true to show loading state immediately
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showOutfitPlanner, setShowOutfitPlanner] = useState(false);
  const [showWoreThisToday, setShowWoreThisToday] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [showOutfitSuggestions, setShowOutfitSuggestions] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);

  useEffect(() => {
    initializeDashboard();

    // Check for success message from OAuth callback
    const successMessage = sessionStorage.getItem('calendar_connection_success');
    if (successMessage) {
      alert(successMessage);
      sessionStorage.removeItem('calendar_connection_success');
      // Don't reload - initializeDashboard() already running above
    }
  }, []);

  // Debug: Track when googleConnected state changes
  useEffect(() => {
    console.log('🔄 [SMART-CALENDAR] googleConnected state changed to:', googleConnected);
    console.log('🔄 [SMART-CALENDAR] googleEmail state:', googleEmail);
  }, [googleConnected, googleEmail]);

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
      console.log('📅 [SMART-CALENDAR] Apple:', appleIsConnected ? 'Connected' : 'Not connected');
      console.log('🔍 [SMART-CALENDAR] Google connection object:', googleConnection);
      console.log('🔍 [SMART-CALENDAR] About to set googleConnected to:', googleIsConnected);

      setGoogleConnected(googleIsConnected);
      setGoogleEmail(googleConnection?.calendar_email || null);
      setAppleConnected(appleIsConnected);
      setAppleEmail(appleConnection?.calendar_email || null);
      setIsConnected(anyConnected);

      console.log('✅ [SMART-CALENDAR] State update completed - googleConnected should now be:', googleIsConnected);

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
    // This callback is called by child components (GoogleCalendarConnection, AppleCalendarConnection)
    // when user manually connects/disconnects. We only need to reload if user just connected.
    // Don't reload on initial mount - initializeDashboard already ran.

    if (connected) {
      console.log('📅 [SMART-CALENDAR] User connected calendar, reloading dashboard');
      await initializeDashboard();
    } else {
      console.log('📅 [SMART-CALENDAR] User disconnected calendar, updating state only');
      setIsConnected(false);
      setGoogleConnected(false);
      setGoogleEmail(null);
      setAppleConnected(false);
      setAppleEmail(null);
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
      work: 'bg-ios-blue text-white',
      personal: 'bg-ios-green text-white',
      travel: 'bg-ios-purple text-white',
      formal: 'bg-ios-fill text-ios-label',
      casual: 'bg-ios-orange text-white'
    };
    return colors[eventType as keyof typeof colors] || colors.casual;
  };

  // =====================================
  // RENDER METHODS FOR DIFFERENT VIEWS
  // =====================================

  const renderConnectionSetup = () => {
    console.log('🎨 [SMART-CALENDAR] Rendering connection setup. Passing to GoogleCalendarConnection:', {
      isConnected: googleConnected,
      calendarEmail: googleEmail
    });

    return (
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
  };

  const handleDateClick = (date: Date) => {
    // Use flushSync to ensure selectedDate is set before showing modal
    // This prevents race condition where modal renders before date is set
    flushSync(() => {
      setSelectedDate(date);
    });
    setShowDateDetails(true);
  };

  const renderCalendarView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* 2x2 Grid Tab Layout */}
      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}
        >
          <SegmentButton
            title="Outfit Queue"
            icon={<PenLine size={24} />}
            isSelected={currentView === 'queue'}
            onClick={() => setCurrentView('queue')}
          />
          <SegmentButton
            title="Packing List"
            icon={<Luggage size={24} />}
            isSelected={currentView === 'packing'}
            onClick={() => setCurrentView('packing')}
          />
          <SegmentButton
            title="Morning Mode"
            icon={<Sunrise size={24} />}
            isSelected={currentView === 'morning'}
            onClick={generateMorningOptions}
          />
          <SegmentButton
            title="Wore This"
            icon={<User size={24} />}
            isSelected={showWoreThisToday}
            onClick={() => setShowWoreThisToday(!showWoreThisToday)}
          />
        </div>
      </div>

      {/* Enhanced Monthly Calendar Grid with Outfit Scheduling */}
      <EnhancedMonthlyCalendarGrid />
    </div>
  );

  const renderMorningMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="ios-title-1 mb-2">Good Morning! ☀️</h2>
        <p className="ios-body text-ios-label-secondary">Here are your personalized outfit options for today</p>
      </div>

      {morningOptions && (
        <div>
          {/* Weather Bar */}
          <div className="ios-card bg-gradient-to-br from-ios-blue/10 to-ios-purple/10 rounded-ios-xl p-4 mb-6 border border-ios-separator">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(morningOptions.weather.condition)}
                <div>
                  <p className="ios-title-3 font-bold">{morningOptions.weather.temperature}°F</p>
                  <p className="ios-caption-1 text-ios-label-secondary">Feels like {morningOptions.weather.feels_like}°F</p>
                </div>
              </div>
              <div className="text-right">
                <p className="ios-callout text-ios-label-secondary">Precipitation: {morningOptions.weather.precipitationChance}%</p>
                <p className="ios-callout text-ios-label-secondary">UV Index: {morningOptions.weather.uvIndex}</p>
              </div>
            </div>
          </div>

          {/* Today's Events */}
          {morningOptions.todaysEvents.length > 0 && (
            <div className="ios-card rounded-ios-xl p-4 mb-6">
              <h3 className="ios-headline mb-3">Today's Schedule</h3>
              <div className="space-y-2">
                {morningOptions.todaysEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 ios-callout">
                    <Clock className="w-4 h-4 text-ios-label-tertiary" />
                    <span className="text-ios-label-secondary">{event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold">{event.title}</span>
                    {event.location && (
                      <>
                        <MapPin className="w-4 h-4 text-ios-label-tertiary" />
                        <span className="text-ios-label-secondary">{event.location}</span>
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
              <div key={option.id} className="ios-card rounded-ios-xl p-4 hover:shadow-ios-lg transition-all">
                <div className="text-center mb-4">
                  <div className="w-32 h-40 bg-ios-fill rounded-ios-lg mx-auto mb-3 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-ios-label-tertiary" />
                    <span className="ios-caption-2 text-ios-label-secondary ml-2">Outfit {index + 1}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="w-4 h-4 text-ios-yellow fill-current" />
                    <span className="ios-callout font-semibold">{option.confidence}% Match</span>
                  </div>
                  <p className="ios-caption-1 text-ios-label-secondary">{option.notes}</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => recordOutfitWorn(option.outfitItems, option.eventId)}
                    className="ios-button-primary w-full"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Wear This Today</span>
                    </div>
                  </button>

                  <div className="flex space-x-2">
                    <button className="flex-1 text-ios-green hover:bg-ios-green/10 py-2 rounded-ios-md transition-colors">
                      <ThumbsUp className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 text-ios-red hover:bg-ios-red/10 py-2 rounded-ios-md transition-colors">
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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Calendar Connections</h3>

        <div className="flex flex-col sm:flex-row gap-4">
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

        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-800 mb-2">About Calendar Sync</h5>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Events are synced automatically when you visit the calendar</li>
            <li>• Only upcoming events (next 60 days) are imported</li>
            <li>• Events are categorized automatically for outfit suggestions</li>
            <li>• Your calendar data stays private and secure</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  // Show loading state while checking for calendar connections
  if (isLoading) {
    console.log('⏳ [SMART-CALENDAR] Loading calendar connections...');
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Checking calendar connections...</p>
        </div>
      </div>
    );
  }

  // Only show connection setup if NOT loading and NOT connected
  if (!isConnected) {
    console.log('📋 [SMART-CALENDAR] No calendar connected, showing setup screen');
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

  console.log('✅ [SMART-CALENDAR] Calendar connected, showing dashboard');

  return (
    <div className="min-h-screen bg-ios-bg">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-ios-label-secondary hover:text-ios-label"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentView('settings')}
            className="text-ios-label-secondary hover:text-ios-label"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="overflow-hidden">
          <div>
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

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={showEditEventModal}
        event={selectedEvent}
        onClose={() => setShowEditEventModal(false)}
        onEventUpdated={() => {
          initializeDashboard();
          setShowEditEventModal(false);
        }}
      />

      {/* Date Details Panel (shows when date is clicked) - MOVED TO TOP LEVEL */}
      {showDateDetails && selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDateDetails(false);
            }
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  {/* Event Type Badge */}
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType}
                  </div>

                  {/* Event Title */}
                  <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>

                  {/* Location */}
                  {event.location && (
                    <p className="text-sm text-gray-600 flex items-center space-x-1 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </p>
                  )}

                  {/* Reminder */}
                  {event.reminderMinutes !== undefined && event.reminderMinutes > 0 && (
                    <p className="text-sm text-gray-600 flex items-center space-x-1 mb-3">
                      <Bell className="w-4 h-4" />
                      <span>
                        Reminder: {
                          event.reminderMinutes < 60
                            ? `${event.reminderMinutes} minutes before`
                            : event.reminderMinutes < 1440
                            ? `${Math.floor(event.reminderMinutes / 60)} hours before`
                            : `${Math.floor(event.reminderMinutes / 1440)} days before`
                        }
                      </span>
                    </p>
                  )}

                  {/* Weather Display (if available) */}
                  {event.location && event.weatherRequired && (
                    <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Cloud className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Weather for {event.location}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Weather forecast will be updated as event approaches</p>
                    </div>
                  )}

                  {/* Outfit Details from Description */}
                  {event.description && (
                    <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Outfit Details</span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-line max-h-48 overflow-y-auto">
                        {event.description}
                      </div>
                    </div>
                  )}

                  {/* Shopping Links */}
                  {event.shoppingLinks && event.shoppingLinks.length > 0 && (
                    <div className="mt-3 mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ShoppingBag className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Shopping Links</span>
                      </div>
                      <div className="space-y-2">
                        {event.shoppingLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.affiliateUrl || link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <ShoppingBag className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-blue-900 truncate">
                                  {link.title || link.store}
                                </p>
                                {link.price && (
                                  <p className="text-xs text-blue-700">{link.price}</p>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plan/Edit Outfit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      // If outfit already exists, open edit mode
                      if (event.outfitId || event.outfitItems || event.description) {
                        // Open edit modal to edit current event details
                        setShowEditEventModal(true);
                      } else {
                        // No outfit yet, open AI suggestions
                        setShowOutfitSuggestions(true);
                      }
                      setShowDateDetails(false);
                    }}
                    className="mt-3 mb-6 w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    {(event.outfitId || event.outfitItems || event.description) ? 'Edit Outfit' : 'Plan Outfit'}
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
};

// SegmentButton Component
interface SegmentButtonProps {
  title: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const SegmentButton: React.FC<SegmentButtonProps> = ({ title, icon, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        padding: '14px 8px',
        background: isSelected ? '#ec4899' : 'rgba(236, 72, 153, 0.15)',
        color: isSelected ? '#ffffff' : '#000000',
        border: isSelected ? 'none' : '1px solid rgba(236, 72, 153, 0.3)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(236, 72, 153, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span
        style={{
          fontSize: '12px',
          fontWeight: isSelected ? 600 : 400,
          lineHeight: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {title}
      </span>
    </button>
  );
};

export default SmartCalendarDashboard;