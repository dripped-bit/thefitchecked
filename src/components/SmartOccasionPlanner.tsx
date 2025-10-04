import React, { useState } from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import SmartOccasionInput, { ParsedOccasion, SmartSuggestion, BudgetRange } from './SmartOccasionInput';
import TripleOutfitGenerator, { GeneratedOutfit } from './TripleOutfitGenerator';
import IntegratedShopping from './IntegratedShopping';
import ExternalTryOnModal from './ExternalTryOnModal';
import SaveToCalendarModal, { CalendarSaveData } from './SaveToCalendarModal';
import { ProductSearchResult } from '../services/perplexityService';
import ClosetService, { ClothingItem } from '../services/closetService';

interface SmartOccasionPlannerProps {
  onOutfitGenerate?: (outfitData: any) => void;
  avatarData?: any;
  onAvatarUpdate?: (avatarData: any) => void;
  onItemGenerated?: (imageUrl: string, prompt: string) => void;
  className?: string;
}

type PlannerState = 'input' | 'generating' | 'outfits' | 'shopping';

const SmartOccasionPlanner: React.FC<SmartOccasionPlannerProps> = ({
  onOutfitGenerate,
  avatarData,
  onAvatarUpdate,
  onItemGenerated,
  className = ''
}) => {
  const [currentState, setCurrentState] = useState<PlannerState>('input');
  const [parsedOccasion, setParsedOccasion] = useState<ParsedOccasion | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(null);
  const [hasTriedOn, setHasTriedOn] = useState(false);

  // Try-on modal state
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<ProductSearchResult | null>(null);

  // Save to calendar modal state
  const [showSaveToCalendarModal, setShowSaveToCalendarModal] = useState(false);

  // Budget selection modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange | null>(null);

  const handleOccasionParsed = (occasion: ParsedOccasion) => {
    setParsedOccasion(occasion);
    setCurrentState('generating');

    // Auto-advance to outfits view after parsing
    setTimeout(() => {
      setCurrentState('outfits');
    }, 100);
  };

  const handleSuggestionSelected = (suggestion: SmartSuggestion) => {
    // Convert suggestion to ParsedOccasion format
    const occasion: ParsedOccasion = {
      originalInput: `${suggestion.title} ${suggestion.date} ${suggestion.time}`,
      occasion: suggestion.title,
      formality: suggestion.formality,
      date: suggestion.date,
      time: suggestion.time,
      location: suggestion.location,
      weather: suggestion.weather ? {
        temperature: suggestion.weather.temp,
        feelsLike: suggestion.weather.temp,
        humidity: 60,
        windSpeed: 5,
        weatherCode: 0,
        weatherDescription: suggestion.weather.condition,
        isDay: true,
        precipitation: 0,
        uvIndex: 6,
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          city: suggestion.location || 'Unknown'
        },
        timestamp: new Date().toISOString()
      } : undefined,
      confidence: 0.9,
      tags: [suggestion.formality]
    };

    setParsedOccasion(occasion);
    setCurrentState('generating');

    setTimeout(() => {
      setCurrentState('outfits');
    }, 100);
  };

  const handleOutfitSelected = (outfit: GeneratedOutfit) => {
    setSelectedOutfit(outfit);
    // Don't automatically go to shopping - user should try on first

    // Trigger callback for parent component
    if (onOutfitGenerate) {
      onOutfitGenerate({
        imageUrl: outfit.imageUrl,
        prompt: `${outfit.personality.name} outfit for ${parsedOccasion?.occasion}`,
        personality: outfit.personality,
        occasion: parsedOccasion
      });
    }

    // Trigger item generated callback
    if (onItemGenerated) {
      onItemGenerated(outfit.imageUrl, `${outfit.personality.name} outfit for ${parsedOccasion?.occasion}`);
    }
  };

  const handleOutfitApplied = (outfit: GeneratedOutfit, avatarUrl: string) => {
    setHasTriedOn(true); // Mark that user has tried on the outfit

    if (onAvatarUpdate) {
      onAvatarUpdate({
        imageUrl: avatarUrl,
        withOutfit: true,
        currentOutfit: outfit,
        qualityScore: 90,
        metadata: {
          lastUpdate: new Date().toISOString(),
          outfitApplied: outfit.personality.name,
          occasion: parsedOccasion?.occasion
        }
      });
    }
  };

  const handleTryOnProduct = (product: ProductSearchResult) => {
    setTryOnProduct(product);
    setShowTryOnModal(true);
  };

  const handleTryOnComplete = () => {
    setShowTryOnModal(false);
    setTryOnProduct(null);
  };

  const handleSaveToCalendar = () => {
    // Open the save to calendar modal
    setShowSaveToCalendarModal(true);
  };

  const handleBudgetSelect = (budget: BudgetRange) => {
    setSelectedBudget(budget);
    setShowBudgetModal(false);
    setCurrentState('shopping');
  };

  const handleCalendarSaveComplete = (data: CalendarSaveData) => {
    if (!selectedOutfit) {
      console.error('No outfit selected');
      return;
    }

    // Create a placeholder clothing item representing the generated outfit
    // In the future, this could be enhanced to save individual items if they exist in the closet
    const outfitPlaceholder: ClothingItem = {
      id: `generated-outfit-${Date.now()}`,
      name: `${selectedOutfit.personality.name} outfit`,
      imageUrl: selectedOutfit.imageUrl,
      category: 'other',
      dateAdded: new Date().toISOString(),
      description: `${selectedOutfit.personality.name} style for ${data.occasion}`,
      isUserGenerated: true,
      source: 'occasion-planner'
    };

    // Save outfit to calendar using ClosetService
    const success = ClosetService.saveDailyOutfit(data.date, [outfitPlaceholder], {
      notes: `${selectedOutfit.personality.name} outfit for ${data.occasion}`,
      needsPurchase: data.needsPurchaseReminder,
      purchaseLink: data.purchaseLink,
      purchaseReminders: data.needsPurchaseReminder ? [data.date] : []
    });

    if (success) {
      console.log('✅ [CALENDAR] Outfit saved successfully:', {
        date: data.date,
        occasion: data.occasion,
        outfit: selectedOutfit.personality.name,
        needsPurchase: data.needsPurchaseReminder,
        purchaseLink: data.purchaseLink
      });

      setShowSaveToCalendarModal(false);

      // Show success message
      setTimeout(() => {
        alert(`✅ Outfit saved to calendar for ${data.occasion} on ${new Date(data.date).toLocaleDateString()}!`);
      }, 100);
    } else {
      console.error('❌ [CALENDAR] Failed to save outfit');
      alert('Failed to save outfit to calendar. Please try again.');
    }
  };

  const handleStartOver = () => {
    setCurrentState('input');
    setParsedOccasion(null);
    setSelectedOutfit(null);
  };

  const renderBackButton = () => {
    if (currentState === 'input') return null;

    return (
      <div className="mb-6">
        <button
          onClick={() => {
            if (currentState === 'shopping') {
              setCurrentState('outfits');
            } else if (currentState === 'outfits') {
              setCurrentState('input');
            }
          }}
          className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
        >
          ← Back to {currentState === 'shopping' ? 'outfit selection' : 'occasion input'}
        </button>
      </div>
    );
  };

  const renderProgressIndicator = () => {
    const steps = [
      { id: 'input', label: 'Occasion', completed: currentState !== 'input' },
      { id: 'outfits', label: 'Outfits', completed: currentState === 'shopping' },
      { id: 'shopping', label: 'Shopping', completed: false }
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center space-x-2 ${
              currentState === step.id ? 'text-purple-600' :
              step.completed ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentState === step.id ? 'bg-purple-600 text-white' :
                step.completed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className="font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 ${
                step.completed ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={`smart-occasion-planner ${className}`}>
      {/* Progress Indicator */}
      {currentState !== 'input' && renderProgressIndicator()}

      {/* Back Button */}
      {renderBackButton()}

      {/* Main Content */}
      {currentState === 'input' && (
        <SmartOccasionInput
          onOccasionParsed={handleOccasionParsed}
          onSuggestionSelected={handleSuggestionSelected}
        />
      )}

      {currentState === 'outfits' && parsedOccasion && (
        <div className="space-y-8">
          <TripleOutfitGenerator
            occasion={parsedOccasion}
            avatarData={avatarData}
            onOutfitSelected={handleOutfitSelected}
            onOutfitApplied={handleOutfitApplied}
          />

          {/* Shop This Look - Only show AFTER try-on */}
          {selectedOutfit && hasTriedOn && (
            <div className="text-center">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop This Look</span>
              </button>
            </div>
          )}
        </div>
      )}

      {currentState === 'shopping' && selectedOutfit && parsedOccasion && (
        <div className="space-y-8">
          {/* Selected Outfit Summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <img
                src={selectedOutfit.imageUrl}
                alt={selectedOutfit.personality.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedOutfit.personality.name} style for {parsedOccasion.occasion}
                </h3>
                <p className="text-gray-600">
                  {parsedOccasion.date} {parsedOccasion.time} • {parsedOccasion.location}
                </p>
              </div>
              <button
                onClick={handleStartOver}
                className="px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>

          <IntegratedShopping
            selectedOutfit={selectedOutfit}
            occasion={parsedOccasion}
            budget={selectedBudget}
            onTryOnProduct={handleTryOnProduct}
            onSaveToCalendar={handleSaveToCalendar}
            avatarData={avatarData}
          />
        </div>
      )}

      {/* Try-On Modal */}
      {showTryOnModal && tryOnProduct && (
        <ExternalTryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          product={tryOnProduct}
          avatarData={avatarData}
          onTryOnComplete={handleTryOnComplete}
        />
      )}

      {/* Save to Calendar Modal */}
      {showSaveToCalendarModal && (
        <SaveToCalendarModal
          isOpen={showSaveToCalendarModal}
          onClose={() => setShowSaveToCalendarModal(false)}
          onSave={handleCalendarSaveComplete}
          defaultOccasion={parsedOccasion?.occasion || ''}
          defaultDate={parsedOccasion?.date || ''}
          outfitImageUrl={selectedOutfit?.imageUrl || ''}
          outfitName={selectedOutfit ? `${selectedOutfit.personality.name} outfit` : ''}
        />
      )}

      {/* Budget Selection Modal */}
      {showBudgetModal && selectedOutfit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="inline-flex w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full items-center justify-center text-white mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Budget</h3>
              <p className="text-gray-600">
                Select your budget range to find the best products for your {selectedOutfit.personality.name} outfit
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Value', range: '$1-50', icon: '🏷️', min: 1, max: 50 },
                { label: 'Budget', range: '$50-100', icon: '💰', min: 50, max: 100 },
                { label: 'Mid-Range', range: '$100-250', icon: '💎', min: 100, max: 250 },
                { label: 'Premium', range: '$250+', icon: '👑', min: 250, max: 1000 }
              ].map((tier) => (
                <button
                  key={tier.label}
                  onClick={() => handleBudgetSelect(tier)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {tier.label}
                      </div>
                      <div className="text-sm text-gray-600">{tier.range}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowBudgetModal(false)}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartOccasionPlanner;