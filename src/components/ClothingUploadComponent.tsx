import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Settings, Download, Save, Zap, Image, ChevronDown, ChevronRight, Loader2, CheckCircle, AlertCircle, Layers } from 'lucide-react';
import { fashnApiService, FashnTryOnParams, FashnResponse, FashnBatchResult } from '../services/fashnApiService';
import multiGarmentDetectionService, { MultiGarmentDetectionResult, DetectedGarment } from '../services/multiGarmentDetectionService';
import { virtualTryOnService } from '../services/virtualTryOnService';

/**
 * Normalize category to FASHN API format (plural forms)
 * Converts singular forms to plural and handles edge cases
 */
const normalizeCategoryForFashn = (category: string | undefined): 'auto' | 'tops' | 'bottoms' | 'one-pieces' => {
  if (!category) return 'auto';

  const cat = category.toLowerCase().trim();

  // Handle singular forms
  if (cat === 'top') return 'tops';
  if (cat === 'bottom') return 'bottoms';
  if (cat === 'one-piece' || cat === 'dress') return 'one-pieces';

  // Handle plural forms (already correct)
  if (cat === 'tops' || cat === 'bottoms' || cat === 'one-pieces') return cat as 'tops' | 'bottoms' | 'one-pieces';

  // Handle other categories
  if (cat === 'skirt') return 'bottoms';
  if (cat === 'outerwear' || cat === 'jacket' || cat === 'coat') return 'tops';

  // Default to auto for unknown categories
  return 'auto';
};

interface ClothingUploadProps {
  avatarImage?: string | File; // The user's avatar/model image
  avatarGender?: 'male' | 'female' | 'unspecified'; // User's gender for better garment detection
  onTryOnComplete?: (result: FashnResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface TryOnSettings {
  category: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  mode: 'performance' | 'balanced' | 'quality';
  moderation_level: 'conservative' | 'permissive' | 'none';
  garment_photo_type: 'auto' | 'flat-lay' | 'model';
  segmentation_free: boolean;
  num_samples: number;
  output_format: 'png' | 'jpeg';
  return_base64: boolean;
  generate_variations: boolean;
  num_variations: number;
}

const ClothingUploadComponent: React.FC<ClothingUploadProps> = ({
  avatarImage,
  avatarGender,
  onTryOnComplete,
  onError,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [results, setResults] = useState<FashnResponse[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Multi-garment detection state
  const [isDetectingGarments, setIsDetectingGarments] = useState(false);
  const [detectionResult, setDetectionResult] = useState<MultiGarmentDetectionResult | null>(null);
  const [showMultiGarmentConfirmation, setShowMultiGarmentConfirmation] = useState(false);
  const [selectedGarments, setSelectedGarments] = useState<DetectedGarment[]>([]);

  // Settings state
  const [settings, setSettings] = useState<TryOnSettings>({
    category: 'auto',
    mode: 'balanced',
    moderation_level: 'none',
    garment_photo_type: 'auto',
    segmentation_free: false, // Default false - uses segmentation to properly remove original clothes
    num_samples: 1,
    output_format: 'png',
    return_base64: false,
    generate_variations: false,
    num_variations: 3
  });

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileSelection(imageFile);
    } else {
      onError?.('Please drop an image file');
    }
  }, [onError]);

  // File selection handler
  const handleFileSelection = useCallback(async (file: File) => {
    // Validate file
    const validation = fashnApiService['validateImageFile']?.(file);
    if (validation && !validation.valid) {
      onError?.(validation.error || 'Invalid image file');
      return;
    }

    setClothingImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string;
      setClothingPreview(previewUrl);

      // Automatically detect multiple garments
      await detectGarmentsInImage(previewUrl);
    };
    reader.readAsDataURL(file);

    console.log('👕 Clothing image selected:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });
  }, [onError]);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // Helper function to reset file input
  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Effect for cleanup and ensuring file input state consistency
  useEffect(() => {
    // Reset file input if no clothing image is selected (component reset)
    if (!clothingImage) {
      resetFileInput();
    }

    // Cleanup function to reset file input when component unmounts
    return () => {
      resetFileInput();
    };
  }, [clothingImage, resetFileInput]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setClothingImage(null);
    setClothingPreview(null);
    setResults([]);
    setDetectionResult(null);
    setShowMultiGarmentConfirmation(false);
    setSelectedGarments([]);
    resetFileInput();
  }, [resetFileInput]);

  // Detect multiple garments in uploaded image
  const detectGarmentsInImage = async (imageUrl: string) => {
    setIsDetectingGarments(true);
    console.log('🔍 Analyzing image for multiple garments...', {
      userGender: avatarGender || 'unspecified'
    });

    try {
      const result = await multiGarmentDetectionService.detectMultipleGarments(
        imageUrl,
        avatarGender
      );
      setDetectionResult(result);

      if (result.success && result.garmentCount > 1) {
        // Multiple garments detected - show confirmation
        setSelectedGarments(result.garments); // Pre-select all detected garments
        setShowMultiGarmentConfirmation(true);
        console.log(`✅ Detected ${result.garmentCount} garments:`, result.garments);
      } else if (result.success && result.garmentCount === 1) {
        // Single garment - auto-set category
        const singleGarment = result.garments[0];
        updateSetting('category', singleGarment.category);
        console.log(`✅ Single garment detected: ${singleGarment.name} (${singleGarment.category})`);
      }
    } catch (error) {
      console.error('❌ Garment detection failed:', error);
      // Silent fail - user can still manually try on
    } finally {
      setIsDetectingGarments(false);
    }
  };

  // Perform multi-garment batch try-on
  const performMultiGarmentTryOn = async () => {
    if (!clothingImage || !avatarImage || !clothingPreview) {
      onError?.('Avatar and clothing images are required');
      return;
    }

    if (!detectionResult || selectedGarments.length === 0) {
      onError?.('No garments selected for try-on');
      return;
    }

    setIsProcessing(true);
    setShowMultiGarmentConfirmation(false);
    setResults([]);

    try {
      const isSuit = detectionResult.isSuit;
      const isFormalWear = selectedGarments.some(g => g.isFormalWear);

      console.log(`🎨 Starting multi-garment try-on for ${selectedGarments.length} items...`, {
        isSuit,
        isFormalWear,
        garments: selectedGarments.map(g => `${g.name} (${g.category})`)
      });

      // For SUITS: Apply sequentially (jacket then pants) with explicit categories
      // For CASUAL: Use auto-detection in single call
      if (isSuit || (isFormalWear && selectedGarments.length === 2)) {
        console.log('🎩 [SUIT-MODE] Detected formal suit - using sequential application');

        // Get avatar image URL
        let currentAvatarUrl: string;
        if (typeof avatarImage === 'string') {
          currentAvatarUrl = avatarImage;
        } else {
          currentAvatarUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(avatarImage);
          });
        }

        // Determine optimal garment_photo_type for formal wear
        const photoType: 'auto' | 'flat-lay' | 'model' = 'flat-lay';

        // Sort garments by suggested order (tops before bottoms)
        const sortedGarments = [...selectedGarments].sort((a, b) => {
          const order = detectionResult.suggestedOrder;
          return order.indexOf(a.category) - order.indexOf(b.category);
        });

        const tryOnResults: FashnResponse[] = [];

        // Apply each piece with explicit category
        for (let i = 0; i < sortedGarments.length; i++) {
          const garment = sortedGarments[i];
          setProcessingStatus(`Applying ${garment.name} (${i + 1}/${sortedGarments.length})...`);

          console.log(`👔 [SUIT-MODE] Applying piece ${i + 1}/${sortedGarments.length}: ${garment.name} (${garment.category})`);

          const tryOnOptions: Partial<FashnTryOnParams> = {
            category: normalizeCategoryForFashn(garment.category), // Normalize to FASHN API format (plural)
            mode: settings.mode,
            moderation_level: settings.moderation_level,
            garment_photo_type: photoType,
            segmentation_free: false,
            num_samples: 1,
            output_format: settings.output_format,
            return_base64: settings.return_base64
          };

          const result = await fashnApiService.virtualTryOn(
            currentAvatarUrl,
            clothingImage,
            tryOnOptions
          );

          tryOnResults.push(result);

          // Use result as avatar for next piece
          if (result.url || result.images?.[0]?.url) {
            currentAvatarUrl = result.url || result.images![0].url;
            console.log(`✅ [SUIT-MODE] ${garment.name} applied, using result for next piece`);
          }
        }

        setResults(tryOnResults);
        const finalResult = tryOnResults[tryOnResults.length - 1];
        onTryOnComplete?.(finalResult);
        setProcessingStatus('Complete! Suit applied.');

        console.log(`✅ [SUIT-MODE] Completed suit application (${sortedGarments.length} pieces)`);

      } else {
        // Casual outfit - use auto-detection
        console.log('👕 [CASUAL-MODE] Using auto-detection for casual outfit');

        setProcessingStatus(`Applying complete outfit (${selectedGarments.map(g => g.name).join(' + ')})...`);

        const tryOnOptions: Partial<FashnTryOnParams> = {
          category: 'auto',
          mode: settings.mode,
          moderation_level: settings.moderation_level,
          garment_photo_type: 'auto',
          segmentation_free: false,
          num_samples: 1,
          output_format: settings.output_format,
          return_base64: settings.return_base64
        };

        const result = await fashnApiService.virtualTryOn(
          avatarImage,
          clothingImage,
          tryOnOptions
        );

        setResults([result]);
        setProcessingStatus('Complete! All garments applied.');
        onTryOnComplete?.(result);

        console.log(`✅ [CASUAL-MODE] Completed casual outfit with auto-detection`);
      }

    } catch (error) {
      console.error('❌ Multi-garment try-on failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Multi-garment try-on failed';
      onError?.(errorMessage);
      setProcessingStatus('Failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProcessingStatus('');
      }, 3000);
    }
  };

  // Settings updaters
  const updateSetting = useCallback(<K extends keyof TryOnSettings>(
    key: K,
    value: TryOnSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Perform virtual try-on
  const performTryOn = async () => {
    if (!clothingImage || !avatarImage) {
      onError?.('Both avatar and clothing images are required');
      return;
    }

    if (!fashnApiService.isConfigured()) {
      onError?.('FASHN API is not configured. Please check your API key.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Preparing images...');
    setResults([]);

    try {
      const tryOnOptions: Partial<FashnTryOnParams> = {
        category: normalizeCategoryForFashn(settings.category), // Normalize to ensure FASHN API format
        mode: settings.mode,
        moderation_level: settings.moderation_level,
        garment_photo_type: settings.garment_photo_type,
        segmentation_free: settings.segmentation_free,
        num_samples: settings.generate_variations ? 1 : settings.num_samples,
        output_format: settings.output_format,
        return_base64: settings.return_base64
      };

      if (settings.generate_variations) {
        // Generate multiple variations
        setProcessingStatus(`Generating ${settings.num_variations} variations...`);

        const variations = await fashnApiService.generateVariations(
          avatarImage,
          clothingImage,
          settings.num_variations,
          tryOnOptions
        );

        const successfulResults = variations
          .filter((result): result is FashnBatchResult & { success: true; data: FashnResponse } => result.success)
          .map(result => result.data);

        setResults(successfulResults);

        if (successfulResults.length > 0) {
          onTryOnComplete?.(successfulResults[0]);
        }

        console.log('✅ Generated variations:', {
          total: variations.length,
          successful: successfulResults.length
        });

      } else {
        // Single try-on
        setProcessingStatus('Processing virtual try-on...');

        const result = await fashnApiService.virtualTryOn(
          avatarImage,
          clothingImage,
          tryOnOptions
        );

        setResults([result]);
        onTryOnComplete?.(result);

        console.log('✅ Try-on completed successfully');
      }

      setProcessingStatus('Complete!');

    } catch (error) {
      console.error('❌ Try-on failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Try-on failed';
      onError?.(errorMessage);
      setProcessingStatus('Failed');
    } finally {
      setIsProcessing(false);
      // Reset file input to allow re-uploading same file
      resetFileInput();
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Generate model with clothing (no user avatar)
  const generateModelWithClothing = async () => {
    if (!clothingImage) {
      onError?.('Please upload a clothing image');
      return;
    }

    if (!fashnApiService.isConfigured()) {
      onError?.('FASHN API is not configured. Please check your API key.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Generating model with clothing...');
    setResults([]);

    try {
      const result = await fashnApiService.productToModel(
        clothingImage,
        undefined, // No model image - generate new
        {
          prompt: 'professional model, studio lighting, fashion photography',
          aspect_ratio: '3:4',
          output_format: settings.output_format,
          return_base64: settings.return_base64
        }
      );

      setResults([result]);
      onTryOnComplete?.(result);
      setProcessingStatus('Complete!');

      console.log('✅ Model generation completed successfully');

    } catch (error) {
      console.error('❌ Model generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Model generation failed';
      onError?.(errorMessage);
      setProcessingStatus('Failed');
    } finally {
      setIsProcessing(false);
      // Reset file input to allow re-uploading same file
      resetFileInput();
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Download result
  const downloadResult = useCallback((result: FashnResponse, index: number = 0) => {
    const imageUrl = result.url || result.base64 || (result.images?.[0]?.url);
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `fashn-tryon-${Date.now()}-${index + 1}.${settings.output_format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [settings.output_format]);

  return (
    <div className={`clothing-upload-container ${className}`}>
      {/* Upload Section */}
      <div className="upload-section mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-amber-600" />
          Upload Clothing
        </h2>

        {/* Upload Box */}
        <div
          className={`upload-box relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-amber-500 bg-amber-50'
              : clothingPreview
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={isProcessing}
            className="hidden"
            id="clothing-upload"
          />

          {clothingPreview ? (
            <div className="preview-container">
              <img
                src={clothingPreview}
                alt="Clothing preview"
                className="max-w-xs max-h-48 object-contain mx-auto mb-3 rounded-lg shadow-lg"
              />
              <p className="text-sm text-gray-600 mb-2">{clothingImage?.name}</p>
              <p className="text-xs text-gray-500 mb-3">
                {clothingImage && `${(clothingImage.size / 1024 / 1024).toFixed(2)}MB`}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="text-red-500 hover:text-red-700 text-sm underline"
                disabled={isProcessing}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon mb-4">
                <Image className="w-12 h-12 text-gray-400 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragging ? 'Drop your clothing image here' : 'Click to upload clothing image'}
              </p>
              <p className="text-sm text-gray-500 mb-2">or drag and drop</p>
              <p className="text-xs text-gray-400">Supports: JPG, PNG, WebP (Max 10MB)</p>
            </div>
          )}

          {isDragging && (
            <div className="absolute inset-0 border-2 border-amber-500 border-dashed rounded-xl bg-amber-100 bg-opacity-50 flex items-center justify-center">
              <p className="text-amber-700 font-medium">Drop image here</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="settings-section mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
          disabled={isProcessing}
        >
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )}
          <Settings className="w-4 h-4 mr-2" />
          Advanced Settings
        </button>

        {showAdvanced && (
          <div className="advanced-settings bg-gray-50 p-6 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Garment Category */}
              <div className="setting-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garment Category
                </label>
                <select
                  value={settings.category}
                  onChange={(e) => updateSetting('category', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="auto">Auto Detect</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="one-pieces">One-Pieces/Dresses</option>
                </select>
              </div>

              {/* Quality Mode */}
              <div className="setting-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Mode
                </label>
                <select
                  value={settings.mode}
                  onChange={(e) => updateSetting('mode', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="performance">Performance (Fast)</option>
                  <option value="balanced">Balanced</option>
                  <option value="quality">Quality (Best)</option>
                </select>
              </div>

              {/* Garment Photo Type */}
              <div className="setting-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garment Photo Type
                </label>
                <select
                  value={settings.garment_photo_type}
                  onChange={(e) => updateSetting('garment_photo_type', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="auto">Auto Detect</option>
                  <option value="flat-lay">Flat Lay</option>
                  <option value="model">On Model</option>
                </select>
              </div>

              {/* Number of Samples */}
              <div className="setting-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Results
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={settings.generate_variations ? settings.num_variations : settings.num_samples}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (settings.generate_variations) {
                      updateSetting('num_variations', value);
                    } else {
                      updateSetting('num_samples', value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.segmentation_free}
                  onChange={(e) => updateSetting('segmentation_free', e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  disabled={isProcessing}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Segmentation-Free Mode (Better for bulky garments)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.generate_variations}
                  onChange={(e) => updateSetting('generate_variations', e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  disabled={isProcessing}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Generate Multiple Variations (Different seeds)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.return_base64}
                  onChange={(e) => updateSetting('return_base64', e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  disabled={isProcessing}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Return Base64 (Enhanced Privacy)
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons space-y-3">
        {avatarImage ? (
          <button
            onClick={performTryOn}
            disabled={!clothingImage || isProcessing || !fashnApiService.isConfigured()}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {processingStatus || 'Processing...'}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Try On with Avatar
              </>
            )}
          </button>
        ) : (
          <button
            onClick={generateModelWithClothing}
            disabled={!clothingImage || isProcessing || !fashnApiService.isConfigured()}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {processingStatus || 'Generating...'}
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Generate Model
              </>
            )}
          </button>
        )}
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div className="results-section mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Try-On Results ({results.length})
          </h3>

          <div className="results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => {
              const imageUrl = result.url || result.base64 || result.images?.[0]?.url;
              if (!imageUrl) return null;

              return (
                <div key={index} className="result-item bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <img
                    src={imageUrl}
                    alt={`Try-on result ${index + 1}`}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Result {index + 1}
                      </span>
                      {result.processing_time && (
                        <span className="text-xs text-gray-500">
                          {result.processing_time.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="result-actions flex space-x-2 mt-3">
                      <button
                        onClick={() => downloadResult(result, index)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          // Save to wardrobe functionality
                          console.log('Saving to wardrobe:', result);
                        }}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Garment Detection Progress */}
      {isDetectingGarments && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-700">Analyzing image for multiple garments...</span>
          </div>
        </div>
      )}

      {/* Multi-Garment Confirmation Modal */}
      {showMultiGarmentConfirmation && detectionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Multiple Garments Detected</h3>
              </div>
              <button
                onClick={() => setShowMultiGarmentConfirmation(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <AlertCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {detectionResult.isSuit ? (
                <>
                  We detected a <strong>formal suit/tuxedo</strong> with {detectionResult.garmentCount} pieces.
                  Both the jacket and pants will be applied sequentially for the best fit.
                </>
              ) : (
                <>
                  We detected {detectionResult.garmentCount} clothing items in this image.
                  Would you like to apply all of them to your avatar?
                </>
              )}
            </p>

            {/* Detected Garments List */}
            <div className="space-y-2 mb-6">
              {detectionResult.garments.map((garment, index) => {
                const isSelected = selectedGarments.includes(garment);
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGarments(prev => prev.filter(g => g !== garment));
                      } else {
                        setSelectedGarments(prev => [...prev, garment]);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900">{garment.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {garment.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{garment.description}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${garment.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(garment.confidence * 100)}%</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estimated Time */}
            <div className={`border rounded-lg p-3 mb-4 ${
              detectionResult.isSuit ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${detectionResult.isSuit ? 'text-purple-600' : 'text-blue-600'}`} />
                <span className={`text-xs ${detectionResult.isSuit ? 'text-purple-800' : 'text-blue-800'}`}>
                  {detectionResult.isSuit ? (
                    <>
                      Formal suit mode: Each piece will be applied sequentially (~{selectedGarments.length * 10} seconds total)
                    </>
                  ) : (
                    <>
                      Using smart auto-detection: All {selectedGarments.length} items will be applied together in ~10 seconds
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMultiGarmentConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={performMultiGarmentTryOn}
                disabled={selectedGarments.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply {selectedGarments.length} Item{selectedGarments.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Processing Status */}
      {processingStatus && !isProcessing && (
        <div className="mt-4 text-center">
          <span className={`text-sm ${
            processingStatus === 'Complete!'
              ? 'text-green-600'
              : processingStatus === 'Failed'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}>
            {processingStatus}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClothingUploadComponent;