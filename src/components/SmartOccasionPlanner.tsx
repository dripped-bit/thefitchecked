import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
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

  // Budget selection modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange | null>(null);
  const [currentBudgetIndex, setCurrentBudgetIndex] = useState(0);

  const budgetTiers = [
    { label: 'Value', range: '$1-50', icon: '🏷️', min: 1, max: 50 },
    { label: 'Budget', range: '$50-100', icon: '💰', min: 50, max: 100 },
    { label: 'Mid-Range', range: '$100-250', icon: '💎', min: 100, max: 250 },
    { label: 'Premium', range: '$250+', icon: '👑', min: 250, max: 1000 }
  ];

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

  const handleBudgetSelect = (budget: BudgetRange) => {
    setSelectedBudget(budget);
    setShowBudgetModal(false);
    setCurrentState('shopping');
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
            onShopThisLook={() => setShowBudgetModal(true)}
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
          onSave={handleCalendarSaveComplete}
          onClose={() => setShowSaveToCalendarModal(false)}
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

            {/* Budget Selector with Arrows */}
            <div className="flex items-center justify-center gap-4 py-6">
              <button
                onClick={() => setCurrentBudgetIndex((prev) => (prev - 1 + budgetTiers.length) % budgetTiers.length)}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full hover:from-green-100 hover:to-blue-100 transition-all shadow-md active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <div className="flex-1 max-w-xs">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-2xl p-6 text-center shadow-lg">
                  <div className="text-4xl mb-2">{budgetTiers[currentBudgetIndex].icon}</div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {budgetTiers[currentBudgetIndex].label}
                  </div>
                  <div className="text-lg text-gray-700 font-semibold">
                    {budgetTiers[currentBudgetIndex].range}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentBudgetIndex((prev) => (prev + 1) % budgetTiers.length)}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full hover:from-green-100 hover:to-blue-100 transition-all shadow-md active:scale-95"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 border-2 border-gray-300 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBudgetSelect(budgetTiers[currentBudgetIndex])}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartOccasionPlanner;