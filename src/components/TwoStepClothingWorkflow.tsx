import React, { useState, useEffect } from 'react';
import {
  Sparkles, Loader, Check, X, RefreshCw, ArrowRight,
  Shirt, Wand2, Eye, ThumbsUp, ThumbsDown, Zap, RotateCcw, AlertTriangle
} from 'lucide-react';
import twoStepClothingService from '../services/twoStepClothingService';
import useDevMode from '../hooks/useDevMode';

interface TwoStepClothingWorkflowProps {
  avatarData?: any;
  onAvatarUpdate?: (avatarData: any) => void;
  onItemGenerated?: (imageUrl: string, prompt: string) => void;
  onWorkflowComplete?: () => void;
  className?: string;
}

const TwoStepClothingWorkflow: React.FC<TwoStepClothingWorkflowProps> = ({
  avatarData,
  onAvatarUpdate,
  onItemGenerated,
  onWorkflowComplete,
  className = ''
}) => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'preview' | 'applying' | 'complete'>('input');
  const [clothingPrompt, setClothingPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy'>('casual');

  // Generated content
  const [generatedClothingUrl, setGeneratedClothingUrl] = useState<string | null>(null);
  const [finalAvatarUrl, setFinalAvatarUrl] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Avatar management state
  const [avatarStatus, setAvatarStatus] = useState<any>(null);
  const [showResetWarning, setShowResetWarning] = useState(false);

  // Dev mode support for auto-filling clothing prompts
  useDevMode({
    onClothingPrompt: (demoData) => {
      setClothingPrompt(demoData || 'Comfortable oversized sweater with high-waisted jeans');
    }
  });

  const styles = [
    { id: 'casual', name: 'Casual', description: 'Comfortable everyday wear' },
    { id: 'formal', name: 'Formal', description: 'Professional business attire' },
    { id: 'trendy', name: 'Trendy', description: 'Modern fashionable pieces' },
    { id: 'vintage', name: 'Vintage', description: 'Classic retro styles' },
    { id: 'minimalist', name: 'Minimalist', description: 'Clean simple designs' },
    { id: 'edgy', name: 'Edgy', description: 'Bold statement pieces' }
  ];

  // Update progress and avatar status from service
  useEffect(() => {
    const updateStatus = () => {
      const workflowProgress = twoStepClothingService.getWorkflowProgress();
      setProgress(workflowProgress.progress);
      setProgressMessage(workflowProgress.message);

      // Update avatar management status
      const status = twoStepClothingService.getAvatarStatus();
      setAvatarStatus(status);
      setShowResetWarning(status.needsResetWarning);
    };

    const interval = setInterval(updateStatus, 500);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Initialize avatar management when avatar data is available
  useEffect(() => {
    if (avatarData && (typeof avatarData === 'string' || avatarData.imageUrl)) {
      const avatarUrl = typeof avatarData === 'string' ? avatarData : avatarData.imageUrl;
      console.log('🏠 [WORKFLOW] Initializing avatar management with:', avatarUrl);
      twoStepClothingService.initializeAvatarManagement(avatarUrl);
    }
  }, [avatarData]);

  /**
   * Step 1: Generate standalone clothing
   */
  const handleGenerateClothing = async () => {
    if (!clothingPrompt.trim()) {
      setError('Please enter a clothing description');
      return;
    }

    try {
      setCurrentStep('generating');
      setError(null);

      console.log('🚀 [UI] Starting Step 1: Generate standalone clothing');

      const result = await twoStepClothingService.generateStandaloneClothing(
        clothingPrompt,
        selectedStyle
      );

      if (result.success && result.imageUrl) {
        setGeneratedClothingUrl(result.imageUrl);
        setCurrentStep('preview');
        console.log('✅ [UI] Step 1 complete - clothing generated');
      } else {
        throw new Error(result.error || 'Failed to generate clothing');
      }

    } catch (error) {
      console.error('❌ [UI] Step 1 failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate clothing');
      setCurrentStep('input');
    }
  };

  /**
   * Step 2: Apply clothing to avatar
   */
  const handleApplyToAvatar = async () => {
    if (!generatedClothingUrl || !avatarData) {
      setError('Missing clothing or avatar data');
      return;
    }

    try {
      setCurrentStep('applying');
      setError(null);

      console.log('🚀 [UI] Starting Step 2: Apply clothing to avatar');

      const avatarImageUrl = avatarData.imageUrl || avatarData;

      const result = await twoStepClothingService.applyClothingToAvatar(
        generatedClothingUrl,
        avatarImageUrl
      );

      if (result.success && result.finalImageUrl) {
        console.log('🎯 [FASHN-DEBUG] FASHN completed successfully!', {
          finalImageUrl: result.finalImageUrl,
          urlLength: result.finalImageUrl.length,
          isValidUrl: result.finalImageUrl.startsWith('http'),
          urlPreview: result.finalImageUrl.substring(0, 100) + '...'
        });

        setFinalAvatarUrl(result.finalImageUrl);
        setCurrentStep('complete');

        // Add cache-busting parameter to prevent image caching issues
        const cacheBustUrl = `${result.finalImageUrl}?t=${Date.now()}`;
        console.log('🖼️ [FASHN-DEBUG] Using cache-busted URL:', cacheBustUrl);

        // Update avatar in parent component
        if (onAvatarUpdate) {
          console.log('🔄 [FASHN-DEBUG] Calling onAvatarUpdate with:', {
            imageUrl: cacheBustUrl,
            withOutfit: true,
            hasCallback: !!onAvatarUpdate
          });

          onAvatarUpdate({
            imageUrl: cacheBustUrl,
            withOutfit: true,
            outfitDetails: {
              description: clothingPrompt,
              generatedClothingUrl: generatedClothingUrl,
              timestamp: new Date().toISOString()
            }
          });

          console.log('✅ [FASHN-DEBUG] Avatar update callback completed');
        } else {
          console.warn('⚠️ [FASHN-DEBUG] No onAvatarUpdate callback provided!');
        }

        // Trigger item generated callback for wishlist/shopping workflow
        if (onItemGenerated && result.finalImageUrl) {
          onItemGenerated(result.finalImageUrl, clothingPrompt);
        }
        console.log('✅ [UI] Step 2 complete - clothing applied to avatar');
      } else {
        throw new Error(result.error || 'Failed to apply clothing to avatar');
      }

    } catch (error) {
      console.error('❌ [UI] Step 2 failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply clothing to avatar');
      setCurrentStep('preview');
    }
  };

  /**
   * Decline and start over
   */
  const handleDeclineClothing = () => {
    console.log('🔄 [UI] User declined clothing - starting over');
    twoStepClothingService.resetWorkflow();
    setGeneratedClothingUrl(null);
    setFinalAvatarUrl(null);
    setCurrentStep('input');
    setError(null);
  };

  /**
   * Complete workflow
   */
  const handleCompleteWorkflow = () => {
    twoStepClothingService.resetWorkflow();
    if (onWorkflowComplete) {
      onWorkflowComplete();
    }
  };

  /**
   * Start new outfit generation workflow
   */
  const handleStartNewOutfit = () => {
    console.log('🔄 [WORKFLOW] Starting new outfit generation');
    twoStepClothingService.resetWorkflow();
    setGeneratedClothingUrl(null);
    setFinalAvatarUrl(null);
    setCurrentStep('input');
    setError(null);
    setProgress(0);
    setProgressMessage('');
    // Keep the current prompt so users can modify it
  };

  /**
   * Retry current step
   */
  const handleRetry = () => {
    if (currentStep === 'generating' || currentStep === 'preview') {
      handleGenerateClothing();
    } else if (currentStep === 'applying') {
      handleApplyToAvatar();
    }
  };

  /**
   * Reset avatar to original state
   */
  const handleResetAvatar = () => {
    console.log('🔄 [WORKFLOW] Resetting avatar to original state');
    const resetState = twoStepClothingService.resetAvatarToOriginal();

    if (resetState && onAvatarUpdate) {
      onAvatarUpdate(resetState.originalAvatar);
    }

    // Reset workflow state
    setCurrentStep('input');
    setGeneratedClothingUrl(null);
    setFinalAvatarUrl(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setShowResetWarning(false);

    console.log('✅ [WORKFLOW] Avatar reset complete');
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Smart Clothing Generator</h3>
            <p className="text-sm text-gray-600">Set your style preferences for outfit recommendations</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Avatar Status */}
            {avatarStatus && (
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">{avatarStatus.statusMessage}</span>
                  {showResetWarning && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                {avatarStatus.changeProgress && (
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          avatarStatus.changeProgress.percentage >= 100
                            ? 'bg-red-500'
                            : avatarStatus.changeProgress.percentage >= 50
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${avatarStatus.changeProgress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {avatarStatus.changeProgress.current}/{avatarStatus.changeProgress.max}
                    </span>
                  </div>
                )}
              </div>
            )}


            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              {['input', 'generating', 'preview', 'applying', 'complete'].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === step
                      ? 'bg-purple-600 ring-2 ring-purple-300'
                      : index < ['input', 'generating', 'preview', 'applying', 'complete'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{progressMessage}</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Simplified Preferences Interface */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">Smart Preferences</h4>
            <p className="text-gray-600">Set your style preferences for outfit recommendations</p>
          </div>

          <div className="space-y-4">
            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id as any)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedStyle === style.id
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs opacity-75">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clothing Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clothing Description
              </label>
              <textarea
                value={clothingPrompt}
                onChange={(e) => setClothingPrompt(e.target.value)}
                placeholder="e.g., 'red silk blouse with buttons', 'dark blue jeans', 'black leather jacket'"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-20"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateClothing}
              disabled={!clothingPrompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              <span>Generate Clothing</span>
            </button>
          </div>
        </div>

        {/* Step 1.5: Generating */}
        {currentStep === 'generating' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">Creating Your Clothing</h4>
            <p className="text-gray-600">Using SeedDream v4 AI to generate a perfect standalone garment...</p>

            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Confirmation */}
        {currentStep === 'preview' && generatedClothingUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Step 2: Preview Your Clothing</h4>
              <p className="text-gray-600">Try this on your avatar?</p>
            </div>

            {/* Generated Clothing Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <div className="max-w-xs mx-auto">
                <img
                  src={generatedClothingUrl}
                  alt="Generated Clothing"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-700 font-medium">"{clothingPrompt}"</p>
                <p className="text-xs text-gray-500 mt-1">Style: {selectedStyle}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleApplyToAvatar}
                disabled={!avatarData}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
              >
                <ThumbsUp className="w-5 h-5" />
                <span>Try On Avatar</span>
              </button>

              <button
                onClick={handleDeclineClothing}
                className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all"
              >
                <ThumbsDown className="w-5 h-5" />
                <span>Generate New</span>
              </button>
            </div>

            {!avatarData && (
              <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                Upload an avatar to try on this clothing
              </div>
            )}
          </div>
        )}

        {/* Step 2.5: Applying */}
        {currentStep === 'applying' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">Applying to Your Avatar</h4>
            <p className="text-gray-600">Using direct FASHN API virtual try-on with FAL fallback...</p>

            <div className="mt-6 flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500">Clothing</p>
              </div>
              <ArrowRight className="w-6 h-6 text-purple-600 animate-pulse" />
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-500">Avatar</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 'complete' && finalAvatarUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Perfect! Clothing Applied</h4>
              <p className="text-gray-600">Your avatar is now wearing the new outfit</p>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Generated Clothing</p>
                <img
                  src={generatedClothingUrl}
                  alt="Generated Clothing"
                  className="w-full h-48 object-contain rounded-lg bg-gray-50"
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Avatar</p>
                <img
                  src={finalAvatarUrl}
                  alt="Avatar with New Clothing"
                  className="w-full h-48 object-contain rounded-lg bg-gray-50"
                />
              </div>
            </div>

            {/* Generate New Button */}
            <button
              onClick={handleStartNewOutfit}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              <span>Generate New</span>
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TwoStepClothingWorkflow;