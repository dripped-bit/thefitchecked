import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import SmartOccasionInput, { ParsedOccasion, SmartSuggestion } from './SmartOccasionInput';
import TripleOutfitGenerator, { GeneratedOutfit } from './TripleOutfitGenerator';
import IntegratedShopping from './IntegratedShopping';
import ExternalTryOnModal from './ExternalTryOnModal';
import { ProductSearchResult } from '../services/perplexityService';

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
    // Mock calendar integration
    console.log('Saving to calendar:', {
      occasion: parsedOccasion?.occasion,
      outfit: selectedOutfit?.personality.name,
      date: parsedOccasion?.date,
      time: parsedOccasion?.time,
      location: parsedOccasion?.location
    });
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
                onClick={() => setCurrentState('shopping')}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop This Look ({selectedOutfit.priceRange})</span>
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
    </div>
  );
};

export default SmartOccasionPlanner;