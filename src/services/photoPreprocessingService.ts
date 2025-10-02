/**
 * Photo Preprocessing Service
 * Optimizes user photos for CGI avatar generation with ByteDance Seedream v4
 */

export interface PhotoValidationResult {
  isValid: boolean;
  isFrontFacing: boolean;
  hasGoodLighting: boolean;
  isHighResolution: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PhotoPreprocessingResult {
  processedImageUrl: string;
  originalImageUrl: string;
  validationResult: PhotoValidationResult;
  enhancementApplied: {
    cropped: boolean;
    lightingEnhanced: boolean;
    resized: boolean;
    contrastAdjusted: boolean;
  };
  metadata: {
    originalDimensions: { width: number; height: number };
    processedDimensions: { width: number; height: number };
    fileSize: number;
    format: string;
    processingTime: number;
  };
}

export interface PhotoEnhancementOptions {
  targetResolution?: { width: number; height: number };
  enableLightingEnhancement?: boolean;
  enableContrastAdjustment?: boolean;
  enableAutoRotation?: boolean;
  compressionQuality?: number;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

export class PhotoPreprocessingService {
  private readonly defaultOptions: PhotoEnhancementOptions = {
    targetResolution: { width: 1024, height: 1024 },
    enableLightingEnhancement: true,
    enableContrastAdjustment: true,
    enableAutoRotation: true,
    compressionQuality: 0.9,
    outputFormat: 'png'
  };

  constructor() {
    console.log('📸 [PHOTO-PREPROCESSING] Service initialized for CGI avatar optimization');
  }

  /**
   * Complete photo preprocessing pipeline for CGI avatar generation
   */
  async preprocessPhoto(
    photoFile: File,
    options: PhotoEnhancementOptions = {}
  ): Promise<PhotoPreprocessingResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };

    console.log('🔄 [PHOTO-PREPROCESSING] Starting complete preprocessing pipeline:', {
      fileName: photoFile.name,
      fileSize: photoFile.size,
      options: finalOptions
    });

    try {
      // Step 1: Validate the input photo
      const validationResult = await this.validatePhoto(photoFile);
      console.log('✅ [VALIDATION] Photo validation completed:', validationResult);

      if (!validationResult.isValid) {
        throw new Error(`Photo validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Step 2: Load image for processing
      const originalImageUrl = URL.createObjectURL(photoFile);
      const imageElement = await this.loadImage(originalImageUrl);
      const originalDimensions = {
        width: imageElement.naturalWidth,
        height: imageElement.naturalHeight
      };

      console.log('📐 [DIMENSIONS] Original image dimensions:', originalDimensions);

      // Step 3: Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to create canvas context for image processing');
      }

      // Step 4: Apply preprocessing enhancements
      let enhancementApplied = {
        cropped: false,
        lightingEnhanced: false,
        resized: false,
        contrastAdjusted: false
      };

      // Auto-crop to optimal aspect ratio for CGI generation
      const croppedImage = await this.cropToOptimalRatio(imageElement);
      enhancementApplied.cropped = true;
      console.log('✂️ [CROPPING] Applied intelligent cropping for CGI optimization');

      // Resize to target resolution
      const resizedImage = await this.resizeForProcessing(
        croppedImage,
        finalOptions.targetResolution!
      );
      enhancementApplied.resized = true;
      console.log('📏 [RESIZE] Resized to optimal resolution:', finalOptions.targetResolution);

      // Enhance lighting if enabled
      let processedImage = resizedImage;
      if (finalOptions.enableLightingEnhancement) {
        processedImage = await this.autoEnhanceLighting(processedImage);
        enhancementApplied.lightingEnhanced = true;
        console.log('💡 [LIGHTING] Applied lighting enhancement');
      }

      // Adjust contrast if enabled
      if (finalOptions.enableContrastAdjustment) {
        processedImage = await this.adjustContrast(processedImage);
        enhancementApplied.contrastAdjusted = true;
        console.log('🌈 [CONTRAST] Applied contrast adjustment');
      }

      // Step 5: Convert to final format and get result URL
      const processedImageUrl = await this.convertToBase64(
        processedImage,
        finalOptions.outputFormat!,
        finalOptions.compressionQuality!
      );

      const processingTime = Date.now() - startTime;

      const result: PhotoPreprocessingResult = {
        processedImageUrl,
        originalImageUrl,
        validationResult,
        enhancementApplied,
        metadata: {
          originalDimensions,
          processedDimensions: finalOptions.targetResolution!,
          fileSize: photoFile.size,
          format: finalOptions.outputFormat!,
          processingTime
        }
      };

      console.log('✅ [PHOTO-PREPROCESSING] Pipeline completed successfully:', {
        processingTime: `${processingTime}ms`,
        enhancementsApplied: Object.keys(enhancementApplied).filter(key => enhancementApplied[key as keyof typeof enhancementApplied])
      });

      return result;

    } catch (error) {
      console.error('❌ [PHOTO-PREPROCESSING] Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Validate photo for CGI avatar generation compatibility
   */
  async validatePhoto(photoFile: File): Promise<PhotoValidationResult> {
    console.log('🔍 [VALIDATION] Starting photo validation for CGI compatibility');

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic file validation
    if (!photoFile.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    if (photoFile.size > 50 * 1024 * 1024) { // 50MB limit
      errors.push('Image file too large (max 50MB)');
    }

    if (photoFile.size < 50 * 1024) { // 50KB minimum
      warnings.push('Image file very small, may result in poor quality');
    }

    // Load image for detailed analysis
    let imageElement: HTMLImageElement | null = null;
    let isFrontFacing = false;
    let hasGoodLighting = false;
    let isHighResolution = false;

    try {
      const imageUrl = URL.createObjectURL(photoFile);
      imageElement = await this.loadImage(imageUrl);
      URL.revokeObjectURL(imageUrl);

      // Check resolution
      const width = imageElement.naturalWidth;
      const height = imageElement.naturalHeight;

      console.log('📐 [VALIDATION] Image dimensions:', { width, height });

      if (width < 512 || height < 512) {
        warnings.push('Low resolution image may result in poor avatar quality');
        suggestions.push('Use an image with at least 1024x1024 resolution for best results');
      } else {
        isHighResolution = true;
      }

      // Check aspect ratio
      const aspectRatio = width / height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        warnings.push('Unusual aspect ratio detected');
        suggestions.push('Square or portrait images work best for avatar generation');
      }

      // Analyze image for face detection and lighting (basic heuristics)
      const analysisResult = await this.analyzeImageContent(imageElement);
      isFrontFacing = analysisResult.isFrontFacing;
      hasGoodLighting = analysisResult.hasGoodLighting;

      if (!isFrontFacing) {
        warnings.push('Image may not be front-facing');
        suggestions.push('Use a clear front-facing photo for best avatar generation results');
      }

      if (!hasGoodLighting) {
        warnings.push('Lighting could be improved');
        suggestions.push('Well-lit photos produce better avatar results');
      }

    } catch (error) {
      errors.push('Failed to analyze image content');
      console.error('❌ [VALIDATION] Image analysis failed:', error);
    }

    const isValid = errors.length === 0;

    const result: PhotoValidationResult = {
      isValid,
      isFrontFacing,
      hasGoodLighting,
      isHighResolution,
      errors,
      warnings,
      suggestions
    };

    console.log('✅ [VALIDATION] Validation completed:', result);
    return result;
  }

  /**
   * Intelligent cropping to optimal aspect ratio for CGI generation
   */
  private async cropToOptimalRatio(imageElement: HTMLImageElement): Promise<HTMLImageElement> {
    console.log('✂️ [CROPPING] Applying intelligent crop for CGI optimization');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    const originalWidth = imageElement.naturalWidth;
    const originalHeight = imageElement.naturalHeight;
    const targetAspectRatio = 3 / 4; // Portrait aspect ratio optimal for full-body avatars

    // Calculate crop dimensions to maintain aspect ratio
    let cropWidth, cropHeight, cropX, cropY;

    const currentAspectRatio = originalWidth / originalHeight;

    if (currentAspectRatio > targetAspectRatio) {
      // Image is too wide, crop sides
      cropHeight = originalHeight;
      cropWidth = originalHeight * targetAspectRatio;
      cropX = (originalWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is too tall, crop top/bottom with face detection bias
      cropWidth = originalWidth;
      cropHeight = originalWidth / targetAspectRatio;
      cropX = 0;
      // Bias crop towards upper portion for face preservation
      cropY = Math.max(0, (originalHeight - cropHeight) * 0.2);
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      imageElement,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return this.canvasToImage(canvas);
  }

  /**
   * Resize image to optimal resolution for processing
   */
  private async resizeForProcessing(
    imageElement: HTMLImageElement,
    targetResolution: { width: number; height: number }
  ): Promise<HTMLImageElement> {
    console.log('📏 [RESIZE] Resizing to target resolution:', targetResolution);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = targetResolution.width;
    canvas.height = targetResolution.height;

    // Use high-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imageElement,
      0, 0, imageElement.naturalWidth, imageElement.naturalHeight,
      0, 0, targetResolution.width, targetResolution.height
    );

    return this.canvasToImage(canvas);
  }

  /**
   * Auto-enhance lighting for better CGI generation results
   */
  private async autoEnhanceLighting(imageElement: HTMLImageElement): Promise<HTMLImageElement> {
    console.log('💡 [LIGHTING] Applying automatic lighting enhancement');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;

    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / (data.length / 4);

    // Apply brightness and contrast adjustment
    const targetBrightness = 128;
    const brightnessFactor = targetBrightness / avgBrightness;
    const contrastFactor = 1.2; // Slight contrast boost

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness adjustment
      data[i] = Math.min(255, data[i] * brightnessFactor);
      data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
      data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);

      // Apply contrast adjustment
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
    }

    ctx.putImageData(imageData, 0, 0);
    return this.canvasToImage(canvas);
  }

  /**
   * Adjust contrast for optimal CGI processing
   */
  private async adjustContrast(imageElement: HTMLImageElement): Promise<HTMLImageElement> {
    console.log('🌈 [CONTRAST] Applying contrast adjustment');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;

    ctx.drawImage(imageElement, 0, 0);

    // Apply contrast filter
    ctx.filter = 'contrast(110%) saturate(105%)';
    ctx.drawImage(canvas, 0, 0);

    return this.canvasToImage(canvas);
  }

  /**
   * Convert image to base64 data URL
   */
  private async convertToBase64(
    imageElement: HTMLImageElement,
    format: string,
    quality: number
  ): Promise<string> {
    console.log('🔄 [CONVERSION] Converting to base64 format:', format);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const mimeType = `image/${format}`;
    return canvas.toDataURL(mimeType, quality);
  }

  /**
   * Analyze image content for face detection and lighting assessment
   */
  private async analyzeImageContent(imageElement: HTMLImageElement): Promise<{
    isFrontFacing: boolean;
    hasGoodLighting: boolean;
  }> {
    console.log('🔍 [ANALYSIS] Analyzing image content for CGI suitability');

    // This is a simplified analysis - in production, you might use more sophisticated
    // computer vision libraries or APIs for face detection and lighting analysis

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple lighting analysis based on brightness distribution
    let brightPixels = 0;
    let darkPixels = 0;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;

      if (brightness > 200) brightPixels++;
      if (brightness < 50) darkPixels++;
    }

    const totalPixels = data.length / 4;
    const avgBrightness = totalBrightness / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    const darkRatio = darkPixels / totalPixels;

    // Heuristic for good lighting: not too many over/underexposed areas
    const hasGoodLighting = brightRatio < 0.1 && darkRatio < 0.2 && avgBrightness > 80 && avgBrightness < 180;

    // Simplified front-facing detection (aspect ratio and center brightness)
    const aspectRatio = canvas.width / canvas.height;
    const centerBrightness = this.getCenterRegionBrightness(imageData);
    const isFrontFacing = aspectRatio > 0.6 && aspectRatio < 1.5 && centerBrightness > avgBrightness * 0.8;

    console.log('📊 [ANALYSIS] Content analysis results:', {
      avgBrightness: Math.round(avgBrightness),
      brightRatio: Math.round(brightRatio * 100) / 100,
      darkRatio: Math.round(darkRatio * 100) / 100,
      hasGoodLighting,
      isFrontFacing,
      aspectRatio: Math.round(aspectRatio * 100) / 100
    });

    return { isFrontFacing, hasGoodLighting };
  }

  /**
   * Get brightness of center region (likely where face would be)
   */
  private getCenterRegionBrightness(imageData: ImageData): number {
    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.min(width, height) / 4;

    let totalBrightness = 0;
    let pixelCount = 0;

    for (let y = centerY - regionSize / 2; y < centerY + regionSize / 2; y++) {
      for (let x = centerX - regionSize / 2; x < centerX + regionSize / 2; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = (y * width + x) * 4;
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
    }

    return pixelCount > 0 ? totalBrightness / pixelCount : 0;
  }

  /**
   * Load image from URL as HTMLImageElement
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Convert canvas to HTMLImageElement
   */
  private canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load processed image'));
        };
        img.src = url;
      });
    });
  }

  /**
   * Get service information and capabilities
   */
  getServiceInfo() {
    return {
      name: 'Photo Preprocessing Service',
      version: '1.0.0',
      description: 'Optimizes user photos for CGI avatar generation',
      capabilities: [
        'Photo validation and quality assessment',
        'Intelligent cropping to optimal aspect ratio',
        'Resolution optimization for CGI processing',
        'Automatic lighting enhancement',
        'Contrast and saturation adjustment',
        'Format conversion and compression'
      ],
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '50MB',
      recommendedResolution: '1024x1024 or higher',
      outputFormats: ['png', 'jpeg', 'webp']
    };
  }
}

// Export singleton instance
export const photoPreprocessingService = new PhotoPreprocessingService();
export default photoPreprocessingService;