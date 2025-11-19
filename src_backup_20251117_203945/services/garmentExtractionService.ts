/**
 * Garment Extraction Service
 * Extracts clothing items from images of people wearing them
 * Uses OpenAI Vision (GPT-4o-mini) for detection and BiRefNet for extraction
 */

import { analyzeImageJSON, base64ToDataUrl } from '../lib/openaiVision';
import birefnetBackgroundRemovalService from './birefnetBackgroundRemovalService';

export interface GarmentDetectionResult {
  hasHuman: boolean;
  garmentType?: string;
  boundingBox?: {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    width: number; // Normalized 0-1
    height: number; // Normalized 0-1
  };
  photoType: 'person-wearing' | 'flat-lay' | 'mannequin' | 'unknown';
  confidence: number;
}

export interface GarmentExtractionResult {
  success: boolean;
  extractedImageUrl?: string;
  originalImageUrl: string;
  wasExtracted: boolean; // True if garment was extracted from person
  detectionResult?: GarmentDetectionResult;
  error?: string;
}

class GarmentExtractionService {

  /**
   * Extract garment from image (handles both person-wearing and flat-lay)
   */
  async extractGarment(imageUrl: string): Promise<GarmentExtractionResult> {
    console.log('👤 [GARMENT-EXTRACT] Starting garment extraction');

    try {
      // Step 1: Detect if person is wearing clothes
      const detection = await this.detectPersonWearing(imageUrl);
      console.log('🔍 [GARMENT-EXTRACT] Detection result:', detection);

      // Step 2: If person detected, extract and crop garment area
      if (detection.hasHuman && detection.boundingBox) {
        console.log('✂️ [GARMENT-EXTRACT] Person detected, extracting garment...');
        
        // Crop to garment bounding box
        const croppedImage = await this.cropToGarment(imageUrl, detection.boundingBox);
        
        // Resize for optimal processing
        console.log('📐 [GARMENT-EXTRACT] Resizing image for optimal processing...');
        const resizedImage = await this.resizeImageForSegmentation(croppedImage, 1024);
        console.log('✅ [GARMENT-EXTRACT] Image resized for faster segmentation');
        
        // Use BiRefNet for background removal
        console.log('🎨 [GARMENT-EXTRACT] Removing background with BiRefNet');
        const bgRemoved = await birefnetBackgroundRemovalService.removeBackground(resizedImage, {
          model: "General Use (Light)",
          operating_resolution: "2048x2048",
          refine_foreground: true,
          output_format: "png"
        });

        console.log('✅ [GARMENT-EXTRACT] Background removed successfully');
        return {
          success: true,
          extractedImageUrl: bgRemoved.imageUrl,
          originalImageUrl: imageUrl,
          wasExtracted: true, // Background removed, clean transparent background
          detectionResult: detection
        };

      } else {
        // No person detected, just remove background from original
        console.log('📐 [GARMENT-EXTRACT] No person detected, processing as flat-lay');
        
        const cleaned = await birefnetBackgroundRemovalService.removeBackground(imageUrl, {
          model: "General Use (Light)",
          operating_resolution: "2048x2048",
          refine_foreground: true,
          output_format: "png"
        });

        if (cleaned.success && cleaned.imageUrl) {
          return {
            success: true,
            extractedImageUrl: cleaned.imageUrl,
            originalImageUrl: imageUrl,
            wasExtracted: false,
            detectionResult: detection
          };
        } else {
          throw new Error('Background removal failed');
        }
      }

    } catch (error) {
      console.error('❌ [GARMENT-EXTRACT] Extraction failed:', error);
      return {
        success: false,
        originalImageUrl: imageUrl,
        wasExtracted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect if person is wearing clothes using OpenAI Vision
   */
  private async detectPersonWearing(imageUrl: string): Promise<GarmentDetectionResult> {
    console.log('🔍 [PERSON-DETECT-OPENAI] Analyzing image for person wearing clothes...');

    try {
      // Convert image to base64 data URL
      const base64Image = await this.imageToBase64(imageUrl);
      const dataUrl = base64ToDataUrl(base64Image, 'image/png');

      const prompt = `Analyze this image to determine if it shows a person wearing clothes.

Your task:
1. Is there a human/person visible in the image?
2. If yes, what type of garment are they wearing (focus on the main/most prominent item)?
3. Provide a bounding box for the garment area (normalized 0-1 coordinates)
4. Determine the photo type

Return ONLY valid JSON:
{
  "hasHuman": true/false,
  "garmentType": "shirt|jacket|dress|pants|top|hoodie|sweater|coat",
  "boundingBox": {
    "x": 0.2,
    "y": 0.15,
    "width": 0.6,
    "height": 0.7
  },
  "photoType": "person-wearing|flat-lay|mannequin|unknown",
  "confidence": 0.95
}

Important:
- boundingBox should frame the GARMENT ONLY (not the entire person)
- x, y are top-left corner (normalized 0-1)
- width, height are dimensions (normalized 0-1)
- If no person, set hasHuman: false and photoType: "flat-lay"`;

      const parsed = await analyzeImageJSON<{
        hasHuman: boolean;
        garmentType?: string;
        boundingBox?: { x: number; y: number; width: number; height: number };
        photoType: string;
        confidence: number;
      }>(dataUrl, prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 500,
        detail: 'low' // Low detail sufficient for detection
      });

      console.log('✅ [PERSON-DETECT-OPENAI] Detection complete:', {
        hasHuman: parsed.hasHuman,
        garmentType: parsed.garmentType,
        photoType: parsed.photoType
      });

      return {
        hasHuman: parsed.hasHuman || false,
        garmentType: parsed.garmentType,
        boundingBox: parsed.boundingBox,
        photoType: parsed.photoType || 'unknown',
        confidence: parsed.confidence || 0.8
      };

    } catch (error) {
      console.error('❌ [PERSON-DETECT-OPENAI] Detection failed:', error);
      
      // Return default (assume flat-lay)
      return {
        hasHuman: false,
        photoType: 'unknown',
        confidence: 0
      };
    }
  }

  /**
   * Crop image to garment bounding box
   */
  private async cropToGarment(
    imageUrl: string,
    boundingBox: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Add 5% padding to ensure we capture full garment
          const padding = 0.05;
          
          // Calculate pixel coordinates with padding
          let sourceX = (boundingBox.x - padding * boundingBox.width) * img.width;
          let sourceY = (boundingBox.y - padding * boundingBox.height) * img.height;
          let sourceWidth = boundingBox.width * (1 + 2 * padding) * img.width;
          let sourceHeight = boundingBox.height * (1 + 2 * padding) * img.height;

          // Clamp to image bounds
          sourceX = Math.max(0, sourceX);
          sourceY = Math.max(0, sourceY);
          sourceWidth = Math.min(img.width - sourceX, sourceWidth);
          sourceHeight = Math.min(img.height - sourceY, sourceHeight);

          console.log('✂️ [CROP] Cropping garment area:', {
            original: boundingBox,
            pixels: { x: sourceX, y: sourceY, w: sourceWidth, h: sourceHeight }
          });

          // Set canvas size to cropped dimensions
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;

          // Draw cropped portion
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight
          );

          // Convert to data URL
          const croppedDataUrl = canvas.toDataURL('image/png');
          resolve(croppedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });
  }

  /**
   * Resize image for optimal segmentation performance
   */
  private async resizeImageForSegmentation(
    imageUrl: string,
    maxDimension: number = 1024
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert back to base64
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          
          console.log(`📐 [RESIZE] Original: ${img.width}x${img.height} → Resized: ${Math.round(width)}x${Math.round(height)}`);
          
          resolve(resizedDataUrl);
        } catch (error) {
          console.error('❌ [RESIZE] Failed to resize image:', error);
          // If resize fails, return original image
          resolve(imageUrl);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ [RESIZE] Failed to load image:', error);
        // If resize fails, return original image
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Convert image to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          resolve(base64Data);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

}

// Export singleton
export const garmentExtractionService = new GarmentExtractionService();
export default garmentExtractionService;
