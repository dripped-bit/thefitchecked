import React, { useState } from 'react';
import {
  User, Loader, Sparkles, RefreshCw, Trash2, ArrowRightCircle,
  Shirt, Sun, Cloud, CloudRain, Snowflake
} from 'lucide-react';
import seamlessTryOnService from '../services/seamlessTryOnService';

interface PreviewOutfit {
  imageUrl: string;
  description: string;
  category?: string;
}

interface NewAvatarLayoutProps {
  avatarData?: any;
  onAvatarUpdate?: (avatarData: any) => void;
}

const NewAvatarLayout: React.FC<NewAvatarLayoutProps> = ({
  avatarData,
  onAvatarUpdate
}) => {
  // State for the new layout
  const [outfitPrompt, setOutfitPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy'>('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewSlide, setShowPreviewSlide] = useState(false);
  const [previewOutfit, setPreviewOutfit] = useState<PreviewOutfit | null>(null);
  const [showWishlistTab, setShowWishlistTab] = useState(false);
  const [isApplyingToAvatar, setIsApplyingToAvatar] = useState(false);

  // Auto-categorization function
  const detectGarmentCategory = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('dress') || lowerDesc.includes('gown') || lowerDesc.includes('jumpsuit')) {
      return 'dresses';
    } else if (lowerDesc.includes('shirt') || lowerDesc.includes('blouse') || lowerDesc.includes('top') || lowerDesc.includes('sweater')) {
      return 'shirts';
    } else if (lowerDesc.includes('pants') || lowerDesc.includes('jeans') || lowerDesc.includes('shorts')) {
      return 'pants';
    } else if (lowerDesc.includes('skirt')) {
      return 'skirts';
    } else if (lowerDesc.includes('shoe') || lowerDesc.includes('boot') || lowerDesc.includes('sneaker')) {
      return 'shoes';
    } else {
      return 'accessories';
    }
  };

  // Generate outfit for preview only
  const handleGenerate = async () => {
    if (!outfitPrompt.trim()) {
      alert('Please enter a clothing description');
      return;
    }

    try {
      setIsGenerating(true);

      // Generate clothing only for preview
      const result = await seamlessTryOnService.generateClothingOnly(
        outfitPrompt,
        selectedStyle,
        true
      );

      if (result.success && result.imageUrl) {
        const category = detectGarmentCategory(outfitPrompt);
        setPreviewOutfit({
          imageUrl: result.imageUrl,
          description: outfitPrompt,
          category: category
        });

        // Slide in preview box from right
        setShowPreviewSlide(true);
      } else {
        alert(result.error || 'Failed to generate clothing');
      }
    } catch (error) {
      console.error('Error generating outfit:', error);
      alert('Error generating outfit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Discard preview
  const handleDiscard = () => {
    setShowPreviewSlide(false);
    setPreviewOutfit(null);
  };

  // Retry generation with same prompt
  const handleRetry = async () => {
    if (outfitPrompt.trim()) {
      await handleGenerate();
    }
  };

  // Apply outfit to avatar (Wear It)
  const handleWearIt = async () => {
    if (!previewOutfit || !avatarData) {
      alert('No outfit to apply or avatar missing');
      return;
    }

    try {
      setIsApplyingToAvatar(true);

      // Use seamless try-on to apply clothing to avatar
      const result = await seamlessTryOnService.generateAndTryOn({
        clothingDescription: previewOutfit.description,
        avatarImage: avatarData.imageUrl || avatarData,
        style: selectedStyle,
        quality: 'balanced',
        enhancePrompts: true
      });

      if (result.success && result.finalImageUrl) {
        // Update avatar
        if (onAvatarUpdate) {
          onAvatarUpdate({
            imageUrl: result.finalImageUrl,
            withOutfit: true,
            outfitDetails: {
              description: previewOutfit.description,
              category: previewOutfit.category
            }
          });
        }

        // Hide preview and show wishlist option
        setShowPreviewSlide(false);
        setPreviewOutfit(null);
        setShowWishlistTab(true);

        // Auto-hide wishlist tab after 5 seconds
        setTimeout(() => {
          setShowWishlistTab(false);
        }, 5000);
      } else {
        alert('Failed to apply outfit to avatar');
      }
    } catch (error) {
      console.error('Error applying outfit:', error);
      alert('Error applying outfit. Please try again.');
    } finally {
      setIsApplyingToAvatar(false);
    }
  };

  // Add to wishlist
  const handleAddToWishlist = () => {
    if (previewOutfit) {
      // In a real implementation, this would save to wishlist and search for similar items
      console.log(`Adding to wishlist: ${previewOutfit.description}`);
      console.log(`Category: ${previewOutfit.category}`);

      // Hide the wishlist tab
      setShowWishlistTab(false);

      // Show success message
      alert(`Added "${previewOutfit.description}" to your ${previewOutfit.category} wishlist!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative">
      {/* Main Layout Container */}
      <div className="relative flex h-screen max-h-[900px]">

        {/* Left Side: Always-visible Avatar (60% width) */}
        <div className="w-[60%] flex items-center justify-center p-8">
          <div className="relative">
            <div className="w-80 aspect-[3/4] rounded-3xl flex items-center justify-center overflow-hidden relative shadow-2xl bg-white">
              {avatarData ? (
                <img
                  src={avatarData.imageUrl || avatarData}
                  alt="Your Digital Avatar"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center space-y-6 p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Your Avatar</h3>
                    <p className="text-slate-500 text-sm">Upload an avatar to get started</p>
                  </div>
                </div>
              )}

              {/* Loading overlay for avatar changes */}
              {isApplyingToAvatar && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-2xl px-6 py-3 flex items-center space-x-3 shadow-lg">
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-medium text-slate-800">Applying outfit...</span>
                  </div>
                </div>
              )}

              {/* Weather indicator */}
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-slate-700 px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-sm">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span>Perfect Weather</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Prompt Input Bar */}
        <div className="absolute top-8 left-[60%] w-[35%] z-20 px-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Describe your outfit
                </label>
                <textarea
                  value={outfitPrompt}
                  onChange={(e) => setOutfitPrompt(e.target.value)}
                  placeholder="e.g., 'red casual t-shirt', 'elegant black dress', 'denim jacket'"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isGenerating}
                >
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="trendy">Trendy</option>
                  <option value="vintage">Vintage</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="edgy">Edgy</option>
                </select>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !outfitPrompt.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sliding Preview Box (slides in from right, positioned below prompt) */}
        <div className={`absolute right-0 top-48 bottom-0 w-[35%] transition-transform duration-300 ease-in-out ${
          showPreviewSlide ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full p-6 flex flex-col">
            {/* Preview Box */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Outfit Preview</h3>

              {/* Preview Image */}
              <div className="flex-1 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl overflow-hidden mb-4">
                {previewOutfit?.imageUrl ? (
                  <img
                    src={previewOutfit.imageUrl}
                    alt="Generated Outfit"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Shirt className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Description */}
              {previewOutfit && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium">{previewOutfit.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Category: {previewOutfit.category}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleWearIt}
                  disabled={!previewOutfit || isApplyingToAvatar}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  {isApplyingToAvatar ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightCircle className="w-4 h-4" />
                      <span>Wear It</span>
                    </>
                  )}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={handleRetry}
                    disabled={isGenerating}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-1 transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>

                  <button
                    onClick={handleDiscard}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 flex items-center justify-center space-x-1 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Discard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Tab (subtle, right edge) */}
        <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
          showWishlistTab ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div
            className="bg-purple-600 text-white rounded-l-lg px-4 py-6 shadow-lg cursor-pointer hover:bg-purple-700 transition-colors duration-200"
            onClick={handleAddToWishlist}
          >
            <div className="text-sm font-medium whitespace-nowrap transform -rotate-90">
              Add to Wishlist?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAvatarLayout;