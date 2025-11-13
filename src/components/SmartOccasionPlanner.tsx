import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, ChevronLeft, X } from 'lucide-react';
import SmartOccasionInput, { ParsedOccasion, SmartSuggestion, BudgetRange } from './SmartOccasionInput';
import TripleOutfitGenerator, { GeneratedOutfit } from './TripleOutfitGenerator';
import IntegratedShopping from './IntegratedShopping';
import ExternalTryOnModal from './ExternalTryOnModal';
import CalendarEntryModal from './CalendarEntryModal';
import { ProductSearchResult } from '../services/perplexityService';
import outfitStorageService from '../services/outfitStorageService';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

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
  const [collectedShoppingLinks, setCollectedShoppingLinks] = useState<ProductSearchResult[]>([]);

  // Budget selection state (default to middle tier)
  const budgetTiers = [
    { label: 'Value', range: '$1-50', icon: '💵', min: 1, max: 50 },
    { label: 'Budget', range: '$50-150', icon: '💳', min: 50, max: 150 },
    { label: 'Premium', range: '$150+', icon: '💎', min: 150, max: 999999 }
  ];
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange | null>(budgetTiers[1]); // Default to middle tier

  const handleOccasionParsed = (occasion: ParsedOccasion) => {
    setParsedOccasion(occasion);
    setCurrentState('generating');

    // Auto-advance to outfits view after parsing
    setTimeout(() => {
      setCurrentState('outfits');
    }, 100);
  };

  const handleSuggestionSelected = (suggestion: SmartSuggestion) => {
    // Use user's typed text if present, otherwise use suggestion details
    const originalInput = suggestion.userTypedInput
      ? suggestion.userTypedInput
      : `${suggestion.title} ${suggestion.date} ${suggestion.time}`;

    console.log('🎯 [OCCASION-SELECTED] Creating occasion:', {
      userTypedInput: suggestion.userTypedInput || 'none',
      occasionTitle: suggestion.title,
      originalInputUsed: originalInput,
      willCombineInGenerator: !!suggestion.userTypedInput
    });

    // Convert suggestion to ParsedOccasion format
    const occasion: ParsedOccasion = {
      originalInput: originalInput,
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

  const handleOutfitApplied = async (outfit: GeneratedOutfit, avatarUrl: string) => {
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

    // Auto-save to Creations
    try {
      // Use the original user input from parsedOccasion for generation_prompt
      const generationPrompt = parsedOccasion?.originalInput || outfit.originalPrompt || outfit.searchPrompt || `${outfit.personality.name} outfit for ${parsedOccasion?.occasion}`;

      const { data, error } = await supabase
        .from('outfits')
        .insert({
          user_id: await authService.getCurrentUser().then(u => u?.id),
          occasion: parsedOccasion?.occasion || 'Unknown Occasion',
          style: outfit.personality.name,
          image_url: avatarUrl, // Save the try-on result image (avatar wearing outfit)
          user_prompt: outfit.originalPrompt || outfit.searchPrompt || `${outfit.personality.name} outfit for ${parsedOccasion?.occasion}`,
          gender: outfit.personality.targetAudience || undefined,
          is_creation: true, // Flag this as an AI-generated creation
          generation_prompt: generationPrompt, // Store the user's original prompt
          clicked: false,
          purchased: false,
          favorited: false,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [PLANNER] Error saving creation:', error);
      } else {
        console.log('✅ [PLANNER] Creation auto-saved:', data.id);
      }
    } catch (error) {
      console.error('❌ [PLANNER] Failed to auto-save creation:', error);
      // Don't show error to user - auto-save is a convenience feature
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

  const handleSaveProductToCalendar = (productUrl: string) => {
    // Add the product URL to collected shopping links
    console.log('📦 [PLANNER] Saving product URL to calendar:', productUrl);
    setCollectedShoppingLinks(prev => [...prev, { url: productUrl } as ProductSearchResult]);
    // Open calendar modal with the product link
    setShowSaveToCalendarModal(true);
  };

  const handleProductsCollected = (products: ProductSearchResult[]) => {
    console.log('🛍️ [PLANNER] Collected shopping links:', products.length);
    setCollectedShoppingLinks(products);
  };

  const handleCalendarSaveComplete = (calendarEntry: any) => {
    console.log('✅ [CALENDAR] Outfit saved successfully:', {
      id: calendarEntry.id,
      occasion: calendarEntry.occasion,
      eventDate: calendarEntry.eventDate,
      shoppingLinks: calendarEntry.shoppingLinks?.length || 0,
      processedLinks: calendarEntry.processedLinks?.length || 0
    });

    setShowSaveToCalendarModal(false);

    // Show success message
    setTimeout(() => {
      const linkCount = calendarEntry.shoppingLinks?.length || 0;
      const message = linkCount > 0
        ? `✅ Outfit saved to calendar with ${linkCount} shopping link${linkCount !== 1 ? 's' : ''}!`
        : `✅ Outfit saved to calendar for ${calendarEntry.occasion}!`;
      alert(message);
    }, 100);
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
            onShopThisLook={() => setCurrentState('shopping')}
            hasTriedOn={hasTriedOn}
          />
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
            onProductsCollected={handleProductsCollected}
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
          onSaveToCalendar={handleSaveProductToCalendar}
        />
      )}

      {/* Save to Calendar Modal */}
      {showSaveToCalendarModal && selectedOutfit && (
        <CalendarEntryModal
          outfit={{
            outfit: selectedOutfit,
            occasion: parsedOccasion?.occasion || '',
            image: selectedOutfit.imageUrl,
            imageUrl: selectedOutfit.imageUrl,
            avatarUrl: selectedOutfit.imageUrl,
            description: `${selectedOutfit.personality.name} style outfit`,
            personality: selectedOutfit.personality,
            searchPrompt: selectedOutfit.searchPrompt || '',
            originalPrompt: selectedOutfit.originalPrompt || ''
          }}
          initialShoppingLinks={collectedShoppingLinks.map(p => p.url)}
          selectedProducts={collectedShoppingLinks.map(p => ({
            url: p.url,
            title: p.title,
            imageUrl: p.imageUrl,
            store: p.store,
            price: p.price
          }))}
          onSave={handleCalendarSaveComplete}
          onClose={() => setShowSaveToCalendarModal(false)}
        />
      )}
    </div>
  );
};

export default SmartOccasionPlanner;