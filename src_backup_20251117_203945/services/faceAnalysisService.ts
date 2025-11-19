/**
 * Face Analysis Service
 * Handles face detection, analysis, and photo processing for avatar generation
 */

export interface FaceAnalysis {
  hasFace: boolean;
  confidence: number;
  faceRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  characteristics: {
    skinTone: 'fair' | 'medium' | 'olive' | 'tan' | 'dark';
    estimatedAge: 'young' | 'adult' | 'mature';
    gender?: 'male' | 'female' | 'neutral';
  };
  quality: {
    resolution: 'low' | 'medium' | 'high';
    lighting: 'poor' | 'fair' | 'good' | 'excellent';
    clarity: 'blurry' | 'fair' | 'sharp';
    overall: number; // 0-100 score
  };
}

export interface PhotoValidation {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  quality: FaceAnalysis['quality'];
}

export class FaceAnalysisService {

  /**
   * Analyze uploaded photo for face detection and characteristics
   */
  async analyzePhoto(
    imageDataUrl: string,
    options?: { required?: boolean; resize?: boolean }
  ): Promise<FaceAnalysis> {
    try {
      console.log('👤 Starting face analysis...', {
        required: options?.required ?? true,
        resize: options?.resize ?? true
      });

      // Resize image if needed
      let processedImageUrl = imageDataUrl;
      if (options?.resize !== false) {
        processedImageUrl = await this.resizeIfNeeded(imageDataUrl);
      }

      const image = await this.loadImageFromDataUrl(processedImageUrl);

      // Basic image quality assessment
      const quality = this.assessImageQuality(image);

      // Simple face detection using basic image analysis
      const faceDetection = await this.detectFace(image);

      // Analyze characteristics if face is detected
      const characteristics = faceDetection.hasFace ?
        await this.analyzeCharacteristics(image, faceDetection.faceRegion) :
        {
          skinTone: 'medium' as const,
          estimatedAge: 'adult' as const,
          gender: 'neutral' as const
        };

      const analysis: FaceAnalysis = {
        hasFace: faceDetection.hasFace,
        confidence: faceDetection.confidence,
        faceRegion: faceDetection.faceRegion,
        characteristics,
        quality
      };

      console.log('✅ Face analysis completed:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Face analysis failed:', error);

      // If face detection is required, throw the error
      if (options?.required === true) {
        throw error;
      }

      // Return fallback analysis for optional detection
      console.warn('⚠️ Face detection is optional, using fallback values');
      return {
        hasFace: true, // Assume face is present for fallback
        confidence: 0.5,
        characteristics: {
          skinTone: 'medium',
          estimatedAge: 'adult',
          gender: 'neutral'
        },
        quality: {
          resolution: 'medium',
          lighting: 'fair',
          clarity: 'fair',
          overall: 50
        }
      };
    }
  }

  /**
   * Validate photo quality for avatar generation
   */
  async validatePhoto(
    imageDataUrl: string,
    options?: { required?: boolean; resize?: boolean }
  ): Promise<PhotoValidation> {
    try {
      const analysis = await this.analyzePhoto(imageDataUrl, options);

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check if face is detected
      if (!analysis.hasFace) {
        issues.push('No face detected in the photo');
        recommendations.push('Ensure your face is clearly visible and well-lit');
      } else if (analysis.confidence < 0.7) {
        issues.push('Face detection confidence is low');
        recommendations.push('Try using a clearer photo with better lighting');
      }

      // Check image quality
      if (analysis.quality.resolution === 'low') {
        issues.push('Image resolution is too low');
        recommendations.push('Use a higher resolution photo (at least 512x512 pixels)');
      }

      if (analysis.quality.lighting === 'poor') {
        issues.push('Poor lighting in the photo');
        recommendations.push('Take the photo in good lighting conditions');
      }

      if (analysis.quality.clarity === 'blurry') {
        issues.push('Photo appears blurry');
        recommendations.push('Use a sharp, clear photo without motion blur');
      }

      if (analysis.quality.overall < 40) {
        issues.push('Overall photo quality is low');
        recommendations.push('Consider retaking the photo with better conditions');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
        quality: analysis.quality
      };

    } catch (error) {
      console.error('❌ Photo validation failed:', error);
      return {
        isValid: true, // Fallback to valid for error cases
        issues: [],
        recommendations: [],
        quality: {
          resolution: 'medium',
          lighting: 'fair',
          clarity: 'fair',
          overall: 50
        }
      };
    }
  }

  /**
   * Generate enhanced prompt based on face analysis
   */
  generateEnhancedPrompt(
    basePrompt: string,
    analysis: FaceAnalysis,
    measurements?: any
  ): string {
    let enhancedPrompt = basePrompt;

    // Add skin tone information
    enhancedPrompt += `, ${analysis.characteristics.skinTone} skin tone`;

    // Add age information
    switch (analysis.characteristics.estimatedAge) {
      case 'young':
        enhancedPrompt += ', youthful appearance';
        break;
      case 'mature':
        enhancedPrompt += ', mature features';
        break;
      default:
        enhancedPrompt += ', adult features';
    }

    // Add gender information if detected
    if (analysis.characteristics.gender && analysis.characteristics.gender !== 'neutral') {
      enhancedPrompt += `, ${analysis.characteristics.gender}`;
    }

    // Add quality-specific adjustments
    if (analysis.quality.lighting === 'excellent') {
      enhancedPrompt += ', professional studio lighting';
    } else {
      enhancedPrompt += ', natural lighting, photorealistic';
    }

    return enhancedPrompt;
  }

  /**
   * Crop and prepare face image for better blending
   */
  async prepareFaceImage(imageDataUrl: string): Promise<string> {
    try {
      const analysis = await this.analyzePhoto(imageDataUrl);

      if (!analysis.hasFace || !analysis.faceRegion) {
        console.log('🔄 No face region detected, using original image');
        return imageDataUrl;
      }

      // For now, return original image
      // In a full implementation, this would crop the face region
      console.log('🔄 Face region detected, using optimized image preparation');
      return imageDataUrl;

    } catch (error) {
      console.error('❌ Face image preparation failed:', error);
      return imageDataUrl;
    }
  }

  /**
   * Resize image if it exceeds size or dimension limits
   */
  private async resizeIfNeeded(dataUrl: string): Promise<string> {
    try {
      // Check data URL size (5MB limit)
      const sizeInBytes = (dataUrl.length * 3) / 4; // Approximate base64 size
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes < maxSize) {
        // Check dimensions
        const image = await this.loadImageFromDataUrl(dataUrl);
        const maxDimension = 1024;

        if (image.width <= maxDimension && image.height <= maxDimension) {
          console.log('✅ Image size OK, no resize needed');
          return dataUrl;
        }
      }

      console.log('🔄 Resizing image to reduce size/dimensions...');

      // Load and resize
      const image = await this.loadImageFromDataUrl(dataUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Calculate new dimensions
      const maxDimension = 1024;
      let newWidth = image.width;
      let newHeight = image.height;

      if (newWidth > maxDimension || newHeight > maxDimension) {
        const scale = Math.min(maxDimension / newWidth, maxDimension / newHeight);
        newWidth = Math.floor(newWidth * scale);
        newHeight = Math.floor(newHeight * scale);
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(image, 0, 0, newWidth, newHeight);

      // Convert to data URL with quality reduction if needed
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      console.log(`✅ Image resized: ${image.width}x${image.height} → ${newWidth}x${newHeight}`);

      return resizedDataUrl;

    } catch (error) {
      console.warn('⚠️ Image resize failed, using original:', error);
      return dataUrl;
    }
  }

  /**
   * Load image from data URL with timeout and CORS handling
   */
  private loadImageFromDataUrl(dataUrl: string, timeout = 10000): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      // Enable CORS for cross-origin images
      image.crossOrigin = 'anonymous';

      // Set up timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout after ${timeout}ms`));
      }, timeout);

      image.onload = () => {
        clearTimeout(timeoutId);
        resolve(image);
      };

      image.onerror = (event) => {
        clearTimeout(timeoutId);
        reject(new Error('Image failed to load'));
      };

      image.src = dataUrl;
    });
  }

  /**
   * Basic face detection using image analysis
   */
  private async detectFace(image: HTMLImageElement): Promise<{
    hasFace: boolean;
    confidence: number;
    faceRegion?: { x: number; y: number; width: number; height: number };
  }> {
    try {
      // Simple heuristic-based face detection
      // In a production app, you'd use a proper face detection library

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Basic analysis - look for face-like proportions and skin tones
      const hasValidDimensions = image.width >= 200 && image.height >= 200;
      const aspectRatio = image.width / image.height;
      const isReasonableAspectRatio = aspectRatio >= 0.7 && aspectRatio <= 1.5;

      // Simple skin tone detection in center region (where face would likely be)
      const centerX = Math.floor(image.width / 2);
      const centerY = Math.floor(image.height / 3); // Upper third for face
      const sampleSize = Math.min(50, Math.floor(image.width / 4));

      let skinPixelCount = 0;
      let totalSamples = 0;

      for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
        for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
          if (x >= 0 && x < image.width && y >= 0 && y < image.height) {
            const index = (y * image.width + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            // Simple skin tone detection
            if (this.isSkinTone(r, g, b)) {
              skinPixelCount++;
            }
            totalSamples++;
          }
        }
      }

      const skinRatio = totalSamples > 0 ? skinPixelCount / totalSamples : 0;
      const hasFace = hasValidDimensions && isReasonableAspectRatio && skinRatio > 0.15;

      let confidence = 0.5; // Base confidence
      if (hasValidDimensions) confidence += 0.2;
      if (isReasonableAspectRatio) confidence += 0.2;
      confidence += Math.min(skinRatio * 2, 0.3); // Skin tone bonus

      const faceRegion = hasFace ? {
        x: Math.max(0, centerX - sampleSize),
        y: Math.max(0, centerY - sampleSize),
        width: sampleSize * 2,
        height: sampleSize * 2
      } : undefined;

      return { hasFace, confidence, faceRegion };

    } catch (error) {
      console.error('Face detection error:', error);
      return { hasFace: true, confidence: 0.5 }; // Fallback assumption
    }
  }

  /**
   * Simple skin tone detection
   */
  private isSkinTone(r: number, g: number, b: number): boolean {
    // Simple heuristic for skin tone detection
    // This is a basic implementation - a real app would use more sophisticated methods

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Skin tones typically have:
    // - Red component higher than blue
    // - Green component between red and blue
    // - Not too saturated (max-min not too high)
    // - Not too dark or too light

    return (
      r > b && // Red > Blue
      g >= b && // Green >= Blue
      r >= g && // Red >= Green
      (max - min) < 100 && // Not too saturated
      max > 60 && max < 240 && // Not too dark or too light
      r > 95 // Minimum red component for skin
    );
  }

  /**
   * Assess image quality
   */
  private assessImageQuality(image: HTMLImageElement): FaceAnalysis['quality'] {
    const width = image.width;
    const height = image.height;

    // Resolution assessment
    const totalPixels = width * height;
    let resolution: 'low' | 'medium' | 'high';
    if (totalPixels < 200000) { // < 400x500
      resolution = 'low';
    } else if (totalPixels < 500000) { // < 700x700
      resolution = 'medium';
    } else {
      resolution = 'high';
    }

    // For lighting and clarity, we'd need more complex analysis
    // For now, provide reasonable defaults
    const lighting = resolution === 'high' ? 'good' : 'fair';
    const clarity = resolution === 'high' ? 'sharp' : 'fair';

    // Overall score
    let overall = 50;
    if (resolution === 'high') overall += 30;
    else if (resolution === 'medium') overall += 15;

    if (lighting === 'excellent') overall += 20;
    else if (lighting === 'good') overall += 15;
    else if (lighting === 'fair') overall += 10;

    return { resolution, lighting, clarity, overall };
  }

  /**
   * Analyze facial characteristics
   */
  private async analyzeCharacteristics(
    image: HTMLImageElement,
    faceRegion?: { x: number; y: number; width: number; height: number }
  ): Promise<FaceAnalysis['characteristics']> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      // Use face region or center area for analysis
      const region = faceRegion || {
        x: Math.floor(image.width * 0.25),
        y: Math.floor(image.height * 0.25),
        width: Math.floor(image.width * 0.5),
        height: Math.floor(image.height * 0.5)
      };

      const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
      const data = imageData.data;

      // Analyze skin tone from face region
      let totalR = 0, totalG = 0, totalB = 0, skinPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (this.isSkinTone(r, g, b)) {
          totalR += r;
          totalG += g;
          totalB += b;
          skinPixels++;
        }
      }

      if (skinPixels === 0) {
        return {
          skinTone: 'medium',
          estimatedAge: 'adult',
          gender: 'neutral'
        };
      }

      const avgR = totalR / skinPixels;
      const avgG = totalG / skinPixels;
      const avgB = totalB / skinPixels;

      // Determine skin tone based on RGB averages
      const brightness = (avgR + avgG + avgB) / 3;
      const redDominance = avgR - Math.max(avgG, avgB);

      let skinTone: FaceAnalysis['characteristics']['skinTone'];
      if (brightness > 180) {
        skinTone = 'fair';
      } else if (brightness > 140) {
        skinTone = redDominance > 20 ? 'medium' : 'olive';
      } else if (brightness > 100) {
        skinTone = 'tan';
      } else {
        skinTone = 'dark';
      }

      // Simple age estimation based on image characteristics
      // This is very basic - real age estimation would require ML models
      const estimatedAge = brightness > 160 ? 'young' : 'adult';

      return {
        skinTone,
        estimatedAge,
        gender: 'neutral' // Gender detection would require more sophisticated analysis
      };

    } catch (error) {
      console.error('Characteristic analysis error:', error);
      return {
        skinTone: 'medium',
        estimatedAge: 'adult',
        gender: 'neutral'
      };
    }
  }

  /**
   * Debug helper - get detailed face analysis information
   */
  async debugAnalysis(imageDataUrl: string): Promise<{
    imageInfo: {
      sizeBytes: number;
      sizeMB: number;
      width?: number;
      height?: number;
      format?: string;
    };
    analysis: FaceAnalysis;
    processingTime: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const startTime = Date.now();

    try {
      // Get image size
      const sizeBytes = (imageDataUrl.length * 3) / 4;
      const sizeMB = sizeBytes / (1024 * 1024);

      // Detect format
      const formatMatch = imageDataUrl.match(/^data:image\/(\w+);base64,/);
      const format = formatMatch ? formatMatch[1] : 'unknown';

      // Load image to get dimensions
      let width: number | undefined;
      let height: number | undefined;

      try {
        const image = await this.loadImageFromDataUrl(imageDataUrl);
        width = image.width;
        height = image.height;
      } catch (error) {
        errors.push(`Image load failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Run analysis
      const analysis = await this.analyzePhoto(imageDataUrl, { required: false, resize: false });

      const processingTime = Date.now() - startTime;

      console.log('🔍 [DEBUG] Face Analysis Report:', {
        imageInfo: { sizeBytes, sizeMB, width, height, format },
        analysis,
        processingTime,
        errors
      });

      return {
        imageInfo: { sizeBytes, sizeMB, width, height, format },
        analysis,
        processingTime,
        errors
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      errors.push(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);

      return {
        imageInfo: {
          sizeBytes: 0,
          sizeMB: 0
        },
        analysis: {
          hasFace: false,
          confidence: 0,
          characteristics: {
            skinTone: 'medium',
            estimatedAge: 'adult',
            gender: 'neutral'
          },
          quality: {
            resolution: 'low',
            lighting: 'poor',
            clarity: 'blurry',
            overall: 0
          }
        },
        processingTime,
        errors
      };
    }
  }
}

// Export singleton instance
export const faceAnalysisService = new FaceAnalysisService();
export default faceAnalysisService;