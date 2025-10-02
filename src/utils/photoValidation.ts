// Photo validation utilities for 3D avatar generation
export interface PhotoValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface PhotoQualityMetrics {
  resolution: { width: number; height: number };
  fileSize: number;
  aspectRatio: number;
  brightness: number;
  contrast: number;
  blur: number;
}

export class PhotoValidator {
  private static readonly MIN_RESOLUTION = { width: 800, height: 1000 };
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly IDEAL_ASPECT_RATIO = 3/4; // Portrait orientation
  private static readonly ASPECT_RATIO_TOLERANCE = 0.2;

  static async validatePhoto(file: File, expectedPose: string): Promise<PhotoValidationResult> {
    const result: PhotoValidationResult = {
      isValid: true,
      score: 100,
      issues: [],
      recommendations: []
    };

    try {
      // Basic file validation
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        result.isValid = false;
        result.issues.push(...fileValidation.issues);
        result.score -= 30;
      }

      // Load image for analysis
      const imageMetrics = await this.analyzeImage(file);

      // Resolution validation
      const resolutionValidation = this.validateResolution(imageMetrics.resolution);
      if (!resolutionValidation.isValid) {
        result.issues.push(...resolutionValidation.issues);
        result.score -= 20;
      }

      // Aspect ratio validation
      const aspectRatioValidation = this.validateAspectRatio(imageMetrics.aspectRatio);
      if (!aspectRatioValidation.isValid) {
        result.issues.push(...aspectRatioValidation.issues);
        result.score -= 15;
      }

      // Image quality validation
      const qualityValidation = this.validateImageQuality(imageMetrics);
      if (!qualityValidation.isValid) {
        result.issues.push(...qualityValidation.issues);
        result.score -= 20;
      }

      // Generate recommendations
      result.recommendations = this.generateRecommendations(expectedPose, result.issues);

      // Final validation
      result.isValid = result.score >= 60; // Minimum acceptable score
      result.score = Math.max(0, result.score);

      return result;

    } catch (error) {
      return {
        isValid: false,
        score: 0,
        issues: ['Failed to analyze photo'],
        recommendations: ['Please try taking the photo again']
      };
    }
  }

  private static validateFile(file: File): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // File type validation
    if (!file.type.startsWith('image/')) {
      issues.push('File must be an image');
    }

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      issues.push('Image file size is too large (max 10MB)');
    }

    if (file.size < 100 * 1024) { // Less than 100KB
      issues.push('Image file size is too small - may be low quality');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private static async analyzeImage(file: File): Promise<PhotoQualityMetrics> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const metrics = this.calculateImageMetrics(imageData, img.width, img.height, file.size);

        resolve(metrics);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static calculateImageMetrics(
    imageData: ImageData,
    width: number,
    height: number,
    fileSize: number
  ): PhotoQualityMetrics {
    const pixels = imageData.data;
    let totalBrightness = 0;
    let totalContrast = 0;
    const brightnessValues: number[] = [];

    // Calculate brightness and collect values for contrast
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate luminance
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessValues.push(brightness);
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / brightnessValues.length;

    // Calculate contrast (standard deviation of brightness)
    const variance = brightnessValues.reduce((acc, val) => acc + Math.pow(val - avgBrightness, 2), 0) / brightnessValues.length;
    const contrast = Math.sqrt(variance);

    // Simple blur detection (edge detection)
    const blur = this.estimateBlur(imageData, width, height);

    return {
      resolution: { width, height },
      fileSize,
      aspectRatio: width / height,
      brightness: avgBrightness / 255, // Normalize to 0-1
      contrast: contrast / 255, // Normalize to 0-1
      blur
    };
  }

  private static estimateBlur(imageData: ImageData, width: number, height: number): number {
    const pixels = imageData.data;
    let sobelSum = 0;
    let pixelCount = 0;

    // Simple Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get surrounding pixels (grayscale)
        const p1 = (pixels[idx - width * 4 - 4] + pixels[idx - width * 4 - 3] + pixels[idx - width * 4 - 2]) / 3;
        const p2 = (pixels[idx - width * 4] + pixels[idx - width * 4 + 1] + pixels[idx - width * 4 + 2]) / 3;
        const p3 = (pixels[idx - width * 4 + 4] + pixels[idx - width * 4 + 5] + pixels[idx - width * 4 + 6]) / 3;
        const p4 = (pixels[idx - 4] + pixels[idx - 3] + pixels[idx - 2]) / 3;
        const p6 = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
        const p7 = (pixels[idx + width * 4 - 4] + pixels[idx + width * 4 - 3] + pixels[idx + width * 4 - 2]) / 3;
        const p8 = (pixels[idx + width * 4] + pixels[idx + width * 4 + 1] + pixels[idx + width * 4 + 2]) / 3;
        const p9 = (pixels[idx + width * 4 + 4] + pixels[idx + width * 4 + 5] + pixels[idx + width * 4 + 6]) / 3;

        // Sobel operators
        const gx = (p3 + 2 * p6 + p9) - (p1 + 2 * p4 + p7);
        const gy = (p1 + 2 * p2 + p3) - (p7 + 2 * p8 + p9);

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        sobelSum += magnitude;
        pixelCount++;
      }
    }

    return sobelSum / pixelCount; // Higher values indicate less blur
  }

  private static validateResolution(resolution: { width: number; height: number }): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (resolution.width < this.MIN_RESOLUTION.width || resolution.height < this.MIN_RESOLUTION.height) {
      issues.push(`Image resolution too low (${resolution.width}x${resolution.height}). Minimum: ${this.MIN_RESOLUTION.width}x${this.MIN_RESOLUTION.height}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private static validateAspectRatio(aspectRatio: number): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const difference = Math.abs(aspectRatio - this.IDEAL_ASPECT_RATIO);

    if (difference > this.ASPECT_RATIO_TOLERANCE) {
      issues.push('Photo should be in portrait orientation (3:4 aspect ratio)');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private static validateImageQuality(metrics: PhotoQualityMetrics): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Brightness validation (0.2 to 0.8 is good range)
    if (metrics.brightness < 0.2) {
      issues.push('Photo is too dark - please use better lighting');
    } else if (metrics.brightness > 0.8) {
      issues.push('Photo is too bright - avoid overexposure');
    }

    // Contrast validation (minimum threshold for detail)
    if (metrics.contrast < 0.1) {
      issues.push('Photo lacks contrast - ensure good lighting conditions');
    }

    // Blur validation (threshold for sharpness)
    if (metrics.blur < 20) {
      issues.push('Photo appears blurry - ensure camera is steady and in focus');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private static generateRecommendations(expectedPose: string, issues: string[]): string[] {
    const recommendations: string[] = [];

    // General recommendations based on pose
    switch (expectedPose.toLowerCase()) {
      case 'front':
        recommendations.push('Stand straight facing the camera with arms at your sides');
        recommendations.push('Ensure your full upper body is visible in frame');
        break;
      case 'side':
        recommendations.push('Turn 90° to your right and stand in profile');
        recommendations.push('Keep your arms away from your body for clear silhouette');
        break;
      case 'back':
        recommendations.push('Turn your back to the camera, standing straight');
        recommendations.push('Keep your head facing forward, not turned');
        break;
    }

    // Issue-specific recommendations
    if (issues.some(issue => issue.includes('dark'))) {
      recommendations.push('Use natural lighting or a well-lit room');
    }

    if (issues.some(issue => issue.includes('bright'))) {
      recommendations.push('Avoid direct sunlight or harsh lighting');
    }

    if (issues.some(issue => issue.includes('blurry'))) {
      recommendations.push('Hold the camera steady and ensure proper focus');
    }

    if (issues.some(issue => issue.includes('resolution'))) {
      recommendations.push('Use a higher quality camera or phone');
    }

    return recommendations;
  }
}

// Pose detection helpers (basic implementation)
export const getPoseInstructions = (pose: string) => {
  const instructions = {
    front: {
      title: 'Front View Photo',
      instructions: [
        'Stand 6-8 feet away from camera',
        'Face directly toward camera',
        'Keep arms slightly away from body',
        'Stand straight with good posture',
        'Ensure full upper body is visible'
      ],
      tips: 'Good lighting is essential for accurate avatar generation'
    },
    side: {
      title: 'Side Profile Photo',
      instructions: [
        'Turn 90° to your right',
        'Stand in complete profile',
        'Keep arms away from body',
        'Look straight ahead (not at camera)',
        'Maintain good posture'
      ],
      tips: 'Profile view helps determine body proportions accurately'
    },
    back: {
      title: 'Back View Photo',
      instructions: [
        'Turn your back to camera',
        'Stand straight and centered',
        'Keep arms slightly away from body',
        'Face forward (not turned)',
        'Ensure full back is visible'
      ],
      tips: 'Back view completes the 360° body shape analysis'
    }
  };

  return instructions[pose as keyof typeof instructions] || instructions.front;
};