import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Upload, RefreshCw, Check, Shirt, Share2 } from 'lucide-react';
import directFashnService from '../services/directFashnService';
import backgroundRemovalService from '../services/backgroundRemovalService';
import { ImageFormatValidator, getAcceptString, getFormatListText } from '../utils/imageFormatValidator';
import { prepareUrlForExternalApi, isValidExternalApiUrl } from '../utils/urlUtils';
import { compressImage, needsCompression, getDataUrlSizeKB } from '../utils/imageCompression';
import { getFashnCompatibleImageUrl, isVideoUrl } from '../utils/videoFrameExtractor';
import { VideoURLValidator, VideoLoader } from '../utils/videoValidation';
import { DirectKlingAvatarService } from '../services/directKlingAvatarService';
import ShareModal from './ShareModal';
import imageExporter from '../utils/imageExporter';

interface AppFacePageProps {
  onNext: () => void;
  onBack: () => void;
  generatedAvatar?: any;
  onAvatarUpdate?: (avatarData: any) => void;
}

const AppFacePage: React.FC<AppFacePageProps> = ({
  onNext,
  onBack,
  generatedAvatar,
  onAvatarUpdate
}) => {
  // Debug log to verify new code is running and generatedAvatar data
  console.log('🚨 [DEBUG] AppFacePage mounted with generatedAvatar:', {
    hasGeneratedAvatar: !!generatedAvatar,
    generatedAvatarKeys: generatedAvatar ? Object.keys(generatedAvatar) : 'none',
    demoMode: generatedAvatar?.metadata?.demoMode,
    imageUrl: generatedAvatar?.imageUrl,
    animatedVideoUrl: generatedAvatar?.animatedVideoUrl
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [outfitApplied, setOutfitApplied] = useState(false);
  const [uploadedOutfit, setUploadedOutfit] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [outfitDetails, setOutfitDetails] = useState('');
  const [error, setError] = useState('');
  const [displayedAvatar, setDisplayedAvatar] = useState<string | null>(null);
  const [videoLoadFailed, setVideoLoadFailed] = useState<boolean>(false);
  const [videoLoadTimeout, setVideoLoadTimeout] = useState<boolean>(false);
  // Kling video generation state
  const [klingVideoUrl, setKlingVideoUrl] = useState<string | null>(null);
  const [isGeneratingKlingVideo, setIsGeneratingKlingVideo] = useState<boolean>(false);
  const [klingVideoError, setKlingVideoError] = useState<string>('');
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get avatar URL from different possible formats (prioritize FASHN results, then CGI, then Kling)
  const getAvatarUrl = () => {
    console.log('🎯 [GET-AVATAR-URL] Checking avatar data:', {
      hasDisplayedAvatar: !!displayedAvatar,
      outfitApplied,
      hasGeneratedAvatar: !!generatedAvatar,
      hasCgiImageUrl: generatedAvatar?.cgiImageUrl,
      hasImageUrl: generatedAvatar?.imageUrl,
      hasAnimatedVideoUrl: generatedAvatar?.animatedVideoUrl,
      isCGI: generatedAvatar?.isCGI,
      keys: generatedAvatar ? Object.keys(generatedAvatar) : 'none'
    });

    // Priority 1: If we have a displayed avatar (FASHN result or user-modified), use that
    if (displayedAvatar) {
      console.log('✅ [GET-AVATAR-URL] Using displayed avatar (FASHN result or modified):', displayedAvatar.substring(0, 50) + '...');
      return displayedAvatar;
    }

    // Priority 2: Check if generatedAvatar has FASHN results
    if (generatedAvatar?.imageUrl) {
      console.log('✅ [GET-AVATAR-URL] Using avatar with applied outfit');
      return generatedAvatar.imageUrl;
    }

    // Priority 3: Fall back to original avatar data
    if (!generatedAvatar) {
      console.warn('⚠️ [GET-AVATAR-URL] No generated avatar data');
      return null;
    }

    // Prioritize CGI avatar if available
    if (generatedAvatar.cgiImageUrl) {
      console.log('✅ [GET-AVATAR-URL] Using CGI avatar image');
      return generatedAvatar.cgiImageUrl; // CGI generated avatar
    } else if (generatedAvatar.imageUrl) {
      console.log('✅ [GET-AVATAR-URL] Using static image');
      return generatedAvatar.imageUrl; // Static image
    } else if (generatedAvatar.animatedVideoUrl) {
      console.log('✅ [GET-AVATAR-URL] Using Kling video');
      return generatedAvatar.animatedVideoUrl; // Kling video
    } else if (generatedAvatar.videoUrl) {
      console.log('✅ [GET-AVATAR-URL] Using alternative video format');
      return generatedAvatar.videoUrl; // Alternative video format
    } else if (typeof generatedAvatar === 'string') {
      console.log('✅ [GET-AVATAR-URL] Using direct URL');
      return generatedAvatar; // Direct URL
    }

    console.warn('⚠️ [GET-AVATAR-URL] No avatar URL found');
    return null;
  };

  // Get static avatar image for FASHN (prioritize CGI, then static images)
  const getStaticAvatarUrl = () => {
    if (!generatedAvatar) return null;

    console.log('🎯 [GET-STATIC-AVATAR] Checking for FASHN-compatible image:', {
      hasCgiImageUrl: !!generatedAvatar.cgiImageUrl,
      hasStaticImageUrl: !!generatedAvatar.staticImageUrl,
      hasImageUrl: !!generatedAvatar.imageUrl,
      isCGI: generatedAvatar.isCGI
    });

    // For FASHN, prioritize CGI images (best quality and compatibility)
    if (generatedAvatar.cgiImageUrl) {
      console.log('✅ [GET-STATIC-AVATAR] Using CGI image for FASHN');
      return generatedAvatar.cgiImageUrl; // CGI image (best for FASHN)
    } else if (generatedAvatar.staticImageUrl) {
      console.log('✅ [GET-STATIC-AVATAR] Using static image for FASHN');
      return generatedAvatar.staticImageUrl; // Static image
    } else if (generatedAvatar.imageUrl) {
      console.log('✅ [GET-STATIC-AVATAR] Using image URL for FASHN');
      return generatedAvatar.imageUrl; // Fallback static image
    } else if (generatedAvatar.animatedVideoUrl) {
      console.log('⚠️ [GET-STATIC-AVATAR] Using video URL for FASHN (may need frame extraction)');
      return generatedAvatar.animatedVideoUrl; // Fallback to video if no static
    } else if (generatedAvatar.videoUrl) {
      console.log('⚠️ [GET-STATIC-AVATAR] Using alternative video for FASHN');
      return generatedAvatar.videoUrl; // Alternative video format
    } else if (typeof generatedAvatar === 'string') {
      console.log('✅ [GET-STATIC-AVATAR] Using direct URL for FASHN');
      return generatedAvatar; // Direct URL
    }

    console.warn('⚠️ [GET-STATIC-AVATAR] No static avatar URL found for FASHN');
    return null;
  };

  // CGI and demo mode aware avatar detection specifically for FASHN
  const getAvatarForFashn = () => {
    console.log('🚨 [FASHN-AVATAR] getAvatarForFashn called - checking CGI and demo modes');
    const isDemoMode = generatedAvatar?.metadata?.demoMode;
    const isCGI = generatedAvatar?.isCGI;

    console.log('🎭 [FASHN-AVATAR] Avatar detection analysis:', {
      isDemoMode,
      isCGI,
      hasGeneratedAvatar: !!generatedAvatar,
      displayedAvatar: !!displayedAvatar,
      generatedAvatarKeys: generatedAvatar ? Object.keys(generatedAvatar) : 'none',
      cgiImageUrl: generatedAvatar?.cgiImageUrl || 'none',
      imageUrl: generatedAvatar?.imageUrl || 'none',
      staticImageUrl: generatedAvatar?.staticImageUrl || 'none'
    });

    // Priority 1: CGI Avatar (best for FASHN)
    if (isCGI && generatedAvatar?.cgiImageUrl) {
      console.log('🎨 [FASHN-AVATAR] Using CGI avatar for FASHN (highest priority)');
      return generatedAvatar.cgiImageUrl;
    }

    // Priority 2: Demo mode
    if (isDemoMode) {
      console.log('🎭 [FASHN-AVATAR] Demo mode detected, using demo avatar');
      const demoStaticUrl = '/78C366D4-95B3-486D-908B-1080B3060B2B.png';
      try {
        return prepareUrlForExternalApi(demoStaticUrl, 'FASHN-DEMO');
      } catch (error) {
        console.error('❌ [FASHN-AVATAR] Failed to prepare demo avatar URL:', error);
        // Continue to fallback detection
      }
    }

    // Priority 3: Regular static avatar detection
    const regularAvatar = displayedAvatar || getStaticAvatarUrl();
    console.log('🎯 [FASHN-AVATAR] Using regular avatar detection result:', {
      regularAvatar: !!regularAvatar,
      avatarValue: regularAvatar
    });

    return regularAvatar;
  };

  // Initialize displayed avatar with generated avatar
  useEffect(() => {
    if (generatedAvatar && !displayedAvatar) {
      const avatarUrl = getAvatarUrl();
      setDisplayedAvatar(avatarUrl);
    }
  }, [generatedAvatar, displayedAvatar]);

  // Reset video loading states when avatar changes
  useEffect(() => {
    console.log('🔄 [MAIN-AVATAR] Resetting video loading states for new avatar');
    setVideoLoadFailed(false);
    setVideoLoadTimeout(false);
  }, [generatedAvatar?.animatedVideoUrl, generatedAvatar?.cgiImageUrl, generatedAvatar?.imageUrl]);

  // Generate Kling video when avatar data is available
  useEffect(() => {
    const isAnimationEnabled = import.meta.env.VITE_ENABLE_AVATAR_ANIMATION === 'true';
    const shouldGenerateKlingVideo = generatedAvatar?.headPhotoData && !klingVideoUrl && !isGeneratingKlingVideo && isAnimationEnabled;

    if (!isAnimationEnabled) {
      console.log('🚫 [KLING-VIDEO] Avatar animation is disabled - skipping video generation');
      console.log('🚫 [KLING-VIDEO] VITE_ENABLE_AVATAR_ANIMATION is set to false');
      return;
    }

    if (shouldGenerateKlingVideo) {
      console.log('🎬 [KLING-VIDEO] Starting video generation...');
      generateKlingVideo();
    }
  }, [generatedAvatar?.headPhotoData]);

  // Generate Kling video for left side display
  const generateKlingVideo = async () => {
    if (!generatedAvatar?.headPhotoData) {
      console.warn('⚠️ [KLING-VIDEO] No head photo data available for video generation');
      return;
    }

    setIsGeneratingKlingVideo(true);
    setKlingVideoError('');

    try {
      console.log('🎬 [KLING-VIDEO] Initializing DirectKlingAvatarService...');
      const klingService = new DirectKlingAvatarService();

      // Build request data
      const videoRequest = {
        headPhotoUrl: generatedAvatar.headPhotoData,
        measurements: generatedAvatar.measurements || {
          heightFeet: '5',
          heightInches: '8',
          bodyType: 'average'
        },
        preferences: {
          style: 'professional',
          clothing: 'white t-shirt and blue shorts'
        }
      };

      console.log('🎬 [KLING-VIDEO] Calling generateDirectAvatar with:', {
        hasHeadPhoto: !!videoRequest.headPhotoUrl,
        hasMeasurements: !!videoRequest.measurements
      });

      const result = await klingService.generateDirectAvatar(videoRequest);

      if (result.success && result.animatedVideoUrl) {
        console.log('✅ [KLING-VIDEO] Video generation successful:', {
          videoUrl: result.animatedVideoUrl.substring(0, 50) + '...',
          duration: '5 seconds'
        });

        setKlingVideoUrl(result.animatedVideoUrl);
      } else {
        throw new Error(result.error || 'Kling video generation failed');
      }

    } catch (error) {
      console.error('❌ [KLING-VIDEO] Video generation failed:', error);
      setKlingVideoError(error instanceof Error ? error.message : 'Video generation failed');
    } finally {
      setIsGeneratingKlingVideo(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file using centralized validator
    const validation = ImageFormatValidator.validateFile(file);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setError('');
    setIsProcessing(true);
    setProcessingStep('Processing your clothing image...');

    try {
      // Convert to base64
      const reader = new FileReader();
      let outfitBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Check if image needs compression to prevent HTTP 413 errors
      const originalSizeKB = getDataUrlSizeKB(outfitBase64);
      console.log('🗜️ Image size check:', {
        originalSizeKB,
        needsCompression: needsCompression(outfitBase64, 500)
      });

      if (needsCompression(outfitBase64, 500)) {
        setProcessingStep('Optimizing image size for processing...');
        console.log('🗜️ Compressing image to prevent payload size errors...');

        try {
          const compressionResult = await compressImage(outfitBase64, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
            maxSizeKB: 500
          });

          outfitBase64 = compressionResult.compressedDataUrl;
          console.log('✅ Image compression complete:', {
            originalSizeKB: Math.round(compressionResult.originalSize / 1024),
            compressedSizeKB: Math.round(compressionResult.compressedSize / 1024),
            compressionRatio: compressionResult.compressionRatio
          });
        } catch (compressionError) {
          console.warn('⚠️ Image compression failed, using original:', compressionError);
          // Continue with original image if compression fails
        }
      }

      setUploadedOutfit(outfitBase64);

      // Get current avatar image - demo mode aware detection for FASHN
      const avatarImage = getAvatarForFashn();
      console.log('🎭 Avatar image check:', {
        displayedAvatar: !!displayedAvatar,
        generatedAvatar: !!generatedAvatar,
        avatarImage: !!avatarImage,
        avatarType: avatarImage ? (typeof avatarImage) : 'undefined',
        generatedAvatarKeys: generatedAvatar ? Object.keys(generatedAvatar) : 'none',
        imageUrl: generatedAvatar?.imageUrl || 'none',
        animatedVideoUrl: generatedAvatar?.animatedVideoUrl || 'none',
        isDemoMode: generatedAvatar?.metadata?.demoMode || false
      });

      // Enhanced error handling with context awareness
      if (!avatarImage) {
        const isDemoMode = generatedAvatar?.metadata?.demoMode;
        if (isDemoMode) {
          console.error('❌ [DEMO-MODE] Avatar not detected despite demo mode being active');
          throw new Error('Demo mode avatar not found. Please refresh the page or toggle demo mode off/on.');
        } else {
          throw new Error('No 3D avatar image available. Please wait for avatar generation to complete.');
        }
      }

      // Ensure avatarImage is a string URL
      const avatarImageStr = typeof avatarImage === 'string' ? avatarImage : (avatarImage?.url || avatarImage?.imageUrl);
      if (!avatarImageStr || typeof avatarImageStr !== 'string') {
        const isDemoMode = generatedAvatar?.metadata?.demoMode;
        console.error('Avatar image data:', avatarImage);
        if (isDemoMode) {
          throw new Error('Demo avatar format error. Please refresh the page or try toggling demo mode.');
        } else {
          throw new Error('3D avatar image is not in the correct format');
        }
      }

      // Step 1: Remove background from clothing for clean transparent fitting
      setProcessingStep('Removing background for clean fitting...');
      console.log('🎨 Starting background removal for transparent clothing...');

      let cleanClothingImage = outfitBase64;
      try {
        const bgRemovalResult = await backgroundRemovalService.removeBackground(outfitBase64);
        if (bgRemovalResult.success && bgRemovalResult.imageUrl) {
          cleanClothingImage = bgRemovalResult.imageUrl;
          if (bgRemovalResult.fallback) {
            console.log('⚠️ Background removal failed, using original image');
          } else {
            console.log('✅ Background removal successful - using transparent image');
          }
        } else {
          console.warn('⚠️ Background removal failed, using original image:', bgRemovalResult.error);
        }
      } catch (bgError) {
        console.warn('⚠️ Background removal error, using original image:', bgError);
      }

      // Step 2: Apply outfit using FASHN AI
      setProcessingStep('Applying outfit to your 3D avatar with FASHN AI...');
      console.log('🎯 Starting FASHN AI try-on process...');

      // Prepare avatar URL for external API access (FASHN needs accessible HTTP URLs)
      let fashnReadyAvatarUrl: string;
      try {
        fashnReadyAvatarUrl = prepareUrlForExternalApi(avatarImageStr, 'FASHN');
        console.log('✅ Avatar URL prepared for FASHN:', {
          original: avatarImageStr,
          prepared: fashnReadyAvatarUrl,
          isValidForExternalApi: isValidExternalApiUrl(fashnReadyAvatarUrl),
          isDemoMode: generatedAvatar?.metadata?.demoMode || false,
          isVideo: isVideoUrl(fashnReadyAvatarUrl)
        });

        // Extract static frame if avatar is a video (FASHN requires static images)
        if (isVideoUrl(fashnReadyAvatarUrl)) {
          setProcessingStep('Extracting static frame from video for FASHN compatibility...');
          console.log('🎬 Video avatar detected, extracting frame for FASHN compatibility');

          try {
            fashnReadyAvatarUrl = await getFashnCompatibleImageUrl(fashnReadyAvatarUrl);
            console.log('✅ Frame extracted from video avatar:', {
              frameSize: Math.round(fashnReadyAvatarUrl.length / 1024) + 'KB',
              isDataUrl: fashnReadyAvatarUrl.startsWith('data:')
            });
          } catch (frameError) {
            console.error('❌ Frame extraction failed:', frameError);
            throw new Error(`Could not extract frame from video avatar: ${frameError.message}`);
          }
        }

      } catch (urlError) {
        console.error('❌ Failed to prepare avatar URL for FASHN:', urlError);
        throw new Error(`Avatar URL preparation failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
      }

      const fashnResult = await directFashnService.tryOnClothing(fashnReadyAvatarUrl, cleanClothingImage);

      if (fashnResult.success && fashnResult.imageUrl) {
        setProcessingStep('Finalizing virtual try-on...');

        // Add cache-bust to ensure browser loads fresh FASHN result
        const cacheBustedUrl = `${fashnResult.imageUrl}?fashn=${Date.now()}`;
        console.log('🎨 [FASHN-DISPLAY] Setting avatar with cache-bust:', {
          original: fashnResult.imageUrl.substring(0, 80) + '...',
          cacheBusted: cacheBustedUrl.substring(0, 80) + '...'
        });

        // Update displayed avatar with outfit applied
        setDisplayedAvatar(cacheBustedUrl);
        setOutfitApplied(true);
        setIsSpinning(true);

        // Set message based on whether fallback was used
        if (fashnResult.fallback) {
          setOutfitDetails('Virtual try-on timed out - showing original avatar. You can try uploading again.');
        } else {
          setOutfitDetails('Outfit applied successfully with FASHN AI');
        }

        // Notify parent component about avatar update
        if (onAvatarUpdate) {
          console.log('👔 Calling onAvatarUpdate with FASHN result:', {
            imageUrl: cacheBustedUrl,
            withOutfit: true,
            outfitDetails: 'Outfit applied with FASHN AI'
          });
          onAvatarUpdate({
            imageUrl: cacheBustedUrl,
            withOutfit: true,
            outfitDetails: 'Outfit applied with FASHN AI'
          });
        } else {
          console.warn('🚨 onAvatarUpdate callback not provided!');
        }

        // Stop spinning after animation
        setTimeout(() => {
          setIsSpinning(false);
        }, 1000);
      } else {
        throw new Error(fashnResult.error || 'FASHN AI virtual try-on failed');
      }
    } catch (error) {
      console.error('FASHN AI outfit application failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply outfit with FASHN AI');
      setOutfitApplied(false);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetToDefault = () => {
    setOutfitApplied(false);
    setUploadedOutfit(null);
    setOutfitDetails('');
    setError('');
    setProcessingStep('');
    // Reset video loading states
    setVideoLoadFailed(false);
    setVideoLoadTimeout(false);
    // Reset to original 3D avatar (blue shorts + white top)
    setDisplayedAvatar(getAvatarUrl());
  };

  const tryAnotherOutfit = () => {
    resetToDefault();
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Small delay to ensure state reset completes
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleShareOutfit = () => {
    setShowShareModal(true);
  };

  const handleDownloadOutfit = async () => {
    const avatarUrl = getAvatarUrl();
    if (!avatarUrl) {
      alert('No outfit to download');
      return;
    }

    try {
      await imageExporter.downloadImage(avatarUrl, {
        fileName: `my-outfit-${Date.now()}`,
        addWatermark: true
      });
    } catch (error) {
      console.error('Failed to download outfit:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <>
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 pb-32 text-center relative overflow-hidden">
      <style>{`
        @keyframes avatarSway {
          0%, 100% { transform: translateX(0) rotateY(0deg); }
          25% { transform: translateX(-3px) rotateY(-2deg); }
          75% { transform: translateX(3px) rotateY(2deg); }
        }

        @keyframes breathing {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.02); }
        }

        @keyframes spin360 {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .avatar-sway {
          animation: avatarSway 3s ease-in-out infinite;
        }

        .avatar-breathing {
          animation: breathing 4s ease-in-out infinite;
        }

        .avatar-spin {
          animation: spin360 1s ease-in-out;
        }

        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes sparkle-move {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .sparkle {
          position: absolute;
          color: #f59e0b;
          animation: sparkle 2s ease-in-out infinite, sparkle-move 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 20;
        }

        .sparkle-1 { animation-delay: 0s, 0s; }
        .sparkle-2 { animation-delay: 0.5s, 0.7s; }
        .sparkle-3 { animation-delay: 1s, 1.4s; }
        .sparkle-4 { animation-delay: 1.5s, 2.1s; }
        .sparkle-5 { animation-delay: 2s, 2.8s; }
        .sparkle-6 { animation-delay: 0.3s, 1.2s; }

      `}</style>

      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-gold-300 rotate-45 opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-amber-300 rotate-12 opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="z-10 max-w-7xl mx-auto pb-32">
        {/* Page Title */}
        <div className="relative inline-block w-full">
          <h1 className="font-dancing-script text-6xl md:text-7xl mb-4 leading-relaxed text-center text-black">
            Try On Outfits
          </h1>

          {/* Sparkle Elements */}
          <div className="sparkle sparkle-1 text-2xl top-0 left-1/4">✨</div>
          <div className="sparkle sparkle-2 text-lg top-4 right-1/4">⭐</div>
          <div className="sparkle sparkle-3 text-xl top-8 left-1/3">✨</div>
          <div className="sparkle sparkle-4 text-lg bottom-2 right-1/3">⭐</div>
          <div className="sparkle sparkle-5 text-2xl bottom-4 left-1/5">✨</div>
          <div className="sparkle sparkle-6 text-lg top-2 right-1/5">⭐</div>
        </div>

        {/* Centered Avatar Display */}
        <div className="flex justify-center items-center mb-8">
          <div className="max-w-sm w-full px-4">
            {/* CGI 3D Avatar */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 text-center">
                {outfitApplied ? 'Avatar with Outfit' : 'CGI 3D Avatar'}
              </h3>
              <div className="relative aspect-[9/16] glass-beige rounded-2xl border-2 border-stone-200/30 shadow-lg overflow-hidden">
                {(() => {
                  const avatarUrl = getAvatarUrl();
                  // Cache-bust already added when FASHN result was set, just use the URL directly
                  const displayUrl = avatarUrl;

                  console.log('🖼️ [RENDER-DEBUG] Avatar URL resolution:', {
                    displayedAvatar: !!displayedAvatar,
                    displayedAvatarValue: displayedAvatar?.substring(0, 100),
                    generatedAvatar: !!generatedAvatar,
                    generatedAvatarImageUrl: generatedAvatar?.imageUrl?.substring(0, 100),
                    outfitApplied,
                    finalAvatarUrl: avatarUrl?.substring(0, 100),
                    willRender: !!avatarUrl
                  });

                  return avatarUrl ? (
                    <img
                      key={displayUrl} // Force re-render when URL changes
                      src={displayUrl}
                      alt={outfitApplied ? "Avatar with applied outfit" : "CGI 3D Avatar with photorealistic quality"}
                      className={`w-full h-full object-cover ${!isProcessing ? (isSpinning ? 'avatar-spin' : 'avatar-breathing') : ''}`}
                      onError={(e) => {
                        console.error('❌ [AVATAR-DISPLAY] Avatar image failed to load:', {
                          url: displayUrl,
                          outfitApplied,
                          displayedAvatar: !!displayedAvatar,
                          error: e
                        });
                      }}
                      onLoad={() => {
                        console.log('✅ [AVATAR-DISPLAY] Avatar image loaded successfully:', {
                          url: displayUrl?.substring(0, 80) + '...',
                          outfitApplied,
                          hasDisplayedAvatar: !!displayedAvatar,
                          isFashnResult: displayUrl?.includes('fashn=')
                        });
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="w-16 h-16 flex items-center justify-center">
                        <Shirt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Loading Avatar...</p>
                    </div>
                  );
                })()}

                {/* Processing Shimmer Effect */}
                {isProcessing && (
                  <div className="absolute inset-0 shimmer-effect rounded-xl"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Centered Under Avatar */}
        <div className="flex justify-center items-center mb-12">
          <div className="max-w-2xl w-full px-4">
            {!isProcessing && (
              <div className="flex flex-col items-center space-y-6">
                {!outfitApplied ? (
                  <div className="w-full space-y-6">
                    {/* Photo Tips - Show BEFORE Upload */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center space-x-2">
                        <span>🖼️</span>
                        <span>Upload Any Garment Image</span>
                      </h3>

                      {/* Image Types */}
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-medium mb-2">✅ You can upload:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                          <div>• Screenshots from online stores</div>
                          <div>• Downloaded fashion images</div>
                          <div>• Photos from social media</div>
                          <div>• Your own garment photos</div>
                        </div>
                      </div>

                      {/* Quality Tips */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">For best quality:</p>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">⭐</span>
                            <span>Garment clearly visible and detailed</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">⭐</span>
                            <span>High resolution images work better</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">⭐</span>
                            <span>Full garment visible (not cropped)</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">If taking your own photo:</p>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold">💡</span>
                            <span>Plain background helps (but not required)</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold">💡</span>
                            <span>Good lighting shows details better</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold">💡</span>
                            <span>Lay flat or hang for best shape</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>🚀 Try it:</strong> Upload any garment image and our AI will automatically optimize it for virtual try-on!
                        </p>
                      </div>
                    </div>

                    {/* Upload Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-3 text-black bg-gradient-to-r from-stone-200/25 via-amber-100/25 to-stone-200/25 rounded-2xl px-8 py-4 shadow-lg hover:scale-105 transition-all duration-300"
                      >
                        <span className="font-medium text-lg">Upload Your Outfit</span>
                        <Upload className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={tryAnotherOutfit}
                      className="flex items-center justify-center space-x-2 glass-beige text-gray-700 px-6 py-3 rounded-xl shadow-md hover:glass-beige-light hover:scale-105 transition-all duration-300"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="font-medium">Try Another Outfit</span>
                    </button>

                    <button
                      onClick={resetToDefault}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                )}

                {/* File Requirements */}
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p>Supported formats: {getFormatListText()} • Max size: 10MB</p>
                  <p className="text-purple-600">✨ Background automatically removed for clean fitting</p>
                </div>
              </div>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptString()}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Two-Section Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">

          {/* Left Section: Dual Avatar Display */}
          <div className="space-y-6 px-4">
            <div className="text-center space-y-2">
              {generatedAvatar?.metadata?.demoMode && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="mr-1">🎭</span>
                  DEMO MODE - Using Hardcoded Avatar
                </div>
              )}
            </div>


          {/* Processing Status */}
          {isProcessing && (
            <div className="mt-4 glass-beige-light rounded-lg p-4">
              <div className="flex items-center justify-center space-x-3">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                <span className="text-gray-700 font-medium">{processingStep}</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                     style={{ width: `${processingStep.includes('Processing') ? '25%' :
                                      processingStep.includes('Removing') ? '50%' :
                                      processingStep.includes('Applying') ? '75%' : '100%'}` }}>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {outfitApplied && !isProcessing && (
            <>
              <div className="mt-4 glass-beige-light rounded-lg p-4 border border-green-200/30">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Perfect fit on your 3D avatar!</span>
                </div>
                {outfitDetails && (
                  <p className="text-sm text-green-600 mt-1">{outfitDetails}</p>
                )}
              </div>

              {/* Share Button */}
              <div className="mt-4">
                <button
                  onClick={handleShareOutfit}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Your Outfit</span>
                </button>
              </div>
            </>
          )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 glass-beige-light rounded-lg p-4 border border-red-200/30">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Section: Try On Outfits */}
          <div className="space-y-6 px-4">
            {/* Outfit Try-On Section */}
            <div className="space-y-6">
              <div className="text-center">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    {/* Navigation Buttons - Left and Right of Image */}
    <div className="fixed inset-y-0 left-0 right-0 flex items-center justify-between px-8 pointer-events-none z-10">
        {/* Back Button - Left Side */}
        <button
          onClick={onBack}
          className="pointer-events-auto"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>

        {/* Continue Button - Right Side */}
        <button
          onClick={onNext}
          disabled={isProcessing}
          className="pointer-events-auto"
        >
          <ArrowRight className={`w-6 h-6 ${isProcessing ? 'text-gray-400' : 'text-black'}`} />
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          outfitData={{
            avatarImageUrl: getAvatarUrl() || '',
            outfitImageUrl: uploadedOutfit || undefined,
            outfitDetails: {
              description: outfitDetails || 'My custom outfit',
              occasion: 'Custom Try-On'
            },
            generatedBy: 'closet'
          }}
          onClose={() => setShowShareModal(false)}
          onDownload={handleDownloadOutfit}
        />
      )}
    </>
  );
};

export default AppFacePage;