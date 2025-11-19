/**
 * Safe Measurement Service
 * Converts raw measurements to FAL-safe descriptors for avatar generation
 * Avoids content moderation triggers while maintaining customization
 */

import { Measurements } from './seedreamV4AvatarService';

export interface SafeBodyDescriptor {
  silhouette: 'slim' | 'athletic' | 'balanced' | 'curvy' | 'plus-size';
  heightCategory: 'petite' | 'average' | 'tall';
  buildType: 'lean' | 'athletic' | 'balanced' | 'fuller-figure';
  clothingSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  proportionType: 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle';
  fitPreference: 'fitted' | 'relaxed' | 'loose' | 'tailored';
}

export interface FaceCharacteristics {
  gender?: 'male' | 'female' | 'neutral';
  ageCategory?: 'young-adult' | 'adult' | 'mature-adult';
  skinTone?: string;
}

export class SafeMeasurementService {
  /**
   * Convert raw measurements to safe descriptors
   */
  createSafeDescriptor(measurements: Measurements): SafeBodyDescriptor {
    return {
      silhouette: this.determineSilhouette(measurements),
      heightCategory: this.categorizeHeight(measurements),
      buildType: this.determineBuildType(measurements),
      clothingSize: this.estimateClothingSize(measurements),
      proportionType: this.analyzeProportions(measurements),
      fitPreference: this.inferFitPreference(measurements)
    };
  }

  /**
   * Determine silhouette from measurements without explicit body part references
   */
  private determineSilhouette(measurements: Measurements): SafeBodyDescriptor['silhouette'] {
    const { chest, waist, hips } = measurements;

    if (!chest || !waist || !hips) {
      return 'balanced'; // Safe default
    }

    // Use ratios to determine silhouette safely
    const chestWaistRatio = chest / waist;
    const hipWaistRatio = hips / waist;
    const chestHipDiff = Math.abs(chest - hips);

    if (chestWaistRatio > 1.25 && hipWaistRatio > 1.25) {
      return 'curvy';
    } else if (chestWaistRatio > 1.3) {
      return 'athletic';
    } else if (chestHipDiff <= 5) {
      return 'balanced';
    } else if (chest < 90 && waist < 75) {
      return 'slim';
    } else {
      return 'plus-size';
    }
  }

  /**
   * Categorize height safely
   */
  private categorizeHeight(measurements: Measurements): SafeBodyDescriptor['heightCategory'] {
    const height = typeof measurements.height === 'string'
      ? parseFloat(measurements.height)
      : measurements.height;

    if (!height) return 'average';

    if (height < 160) return 'petite';
    if (height > 175) return 'tall';
    return 'average';
  }

  /**
   * Determine build type using safe terminology
   */
  private determineBuildType(measurements: Measurements): SafeBodyDescriptor['buildType'] {
    if (measurements.build) {
      // Map existing build types to safe alternatives
      switch (measurements.build) {
        case 'slim': return 'lean';
        case 'athletic': return 'athletic';
        case 'muscular': return 'athletic';
        case 'curvy': return 'fuller-figure';
        default: return 'balanced';
      }
    }

    // Infer from measurements safely
    const { shoulders, waist } = measurements;
    if (shoulders && waist) {
      const shoulderWaistRatio = shoulders / waist;
      if (shoulderWaistRatio > 1.4) return 'athletic';
      if (shoulderWaistRatio < 1.2) return 'lean';
    }

    return 'balanced';
  }

  /**
   * Estimate clothing size instead of using raw measurements
   */
  private estimateClothingSize(measurements: Measurements): SafeBodyDescriptor['clothingSize'] {
    const { chest, waist } = measurements;

    if (!chest || !waist) return 'M'; // Safe default

    // Use industry-standard size mapping
    const avgMeasurement = (chest + waist) / 2;

    if (avgMeasurement < 75) return 'XS';
    if (avgMeasurement < 85) return 'S';
    if (avgMeasurement < 95) return 'M';
    if (avgMeasurement < 105) return 'L';
    if (avgMeasurement < 115) return 'XL';
    return 'XXL';
  }

  /**
   * Analyze body proportions using fashion terminology
   */
  private analyzeProportions(measurements: Measurements): SafeBodyDescriptor['proportionType'] {
    const { chest, waist, hips, shoulders } = measurements;

    if (!chest || !waist || !hips) return 'rectangle';

    const chestHipDiff = Math.abs(chest - hips);
    const waistDiff = Math.min(chest - waist, hips - waist);

    // Use fashion industry terminology
    if (waistDiff > 15 && chestHipDiff <= 5) {
      return 'hourglass';
    } else if (hips > chest + 5) {
      return 'pear';
    } else if (chest > hips + 5 || (shoulders && shoulders > hips + 10)) {
      return 'inverted-triangle';
    } else if (waistDiff < 8) {
      return 'rectangle';
    } else if (waist > chest && waist > hips) {
      return 'apple';
    }

    return 'rectangle'; // Safe default
  }

  /**
   * Infer fit preference from measurements and build
   */
  private inferFitPreference(measurements: Measurements): SafeBodyDescriptor['fitPreference'] {
    const buildType = this.determineBuildType(measurements);
    const silhouette = this.determineSilhouette(measurements);

    // Safe fit preferences based on body type
    if (buildType === 'athletic' || silhouette === 'slim') {
      return 'fitted';
    } else if (silhouette === 'curvy' || silhouette === 'plus-size') {
      return 'tailored';
    } else if (buildType === 'lean') {
      return 'relaxed';
    }

    return 'tailored'; // Professional default
  }

  /**
   * Create safe face characteristics from analysis
   */
  createSafeFaceCharacteristics(
    gender?: string,
    age?: number,
    skinTone?: string
  ): FaceCharacteristics {
    return {
      gender: this.normalizeSafeGender(gender),
      ageCategory: this.categorizeSafeAge(age),
      skinTone: this.sanitizeSkinTone(skinTone)
    };
  }

  /**
   * Normalize gender to safe values
   */
  private normalizeSafeGender(gender?: string): FaceCharacteristics['gender'] {
    if (!gender) return undefined;

    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'man') return 'male';
    if (normalized === 'female' || normalized === 'woman') return 'female';
    return 'neutral'; // Safe default for any other values
  }

  /**
   * Categorize age safely
   */
  private categorizeSafeAge(age?: number): FaceCharacteristics['ageCategory'] {
    if (!age) return 'adult';

    if (age < 30) return 'young-adult';
    if (age > 50) return 'mature-adult';
    return 'adult';
  }

  /**
   * Sanitize skin tone description
   */
  private sanitizeSkinTone(skinTone?: string): string | undefined {
    if (!skinTone) return undefined;

    // Use professional photography/fashion industry terms
    const safeTerms = [
      'fair', 'light', 'medium', 'olive', 'tan', 'deep', 'dark',
      'warm undertones', 'cool undertones', 'neutral undertones'
    ];

    const normalized = skinTone.toLowerCase();
    const safeTerm = safeTerms.find(term => normalized.includes(term.toLowerCase()));

    return safeTerm || 'medium'; // Safe default
  }

  /**
   * Generate clothing size recommendations
   */
  generateSizeRecommendations(measurements: Measurements): {
    top: string;
    bottom: string;
    dress: string;
    general: string;
  } {
    const safeDescriptor = this.createSafeDescriptor(measurements);

    return {
      top: safeDescriptor.clothingSize,
      bottom: safeDescriptor.clothingSize,
      dress: safeDescriptor.clothingSize,
      general: safeDescriptor.clothingSize
    };
  }

  /**
   * Get safe styling recommendations
   */
  getStylingRecommendations(measurements: Measurements): {
    silhouette: string[];
    styles: string[];
    fits: string[];
  } {
    const descriptor = this.createSafeDescriptor(measurements);

    const recommendations = {
      silhouette: this.getSilhouetteRecommendations(descriptor.proportionType),
      styles: this.getStyleRecommendations(descriptor.buildType),
      fits: this.getFitRecommendations(descriptor.fitPreference)
    };

    return recommendations;
  }

  /**
   * Get silhouette styling recommendations
   */
  private getSilhouetteRecommendations(proportionType: SafeBodyDescriptor['proportionType']): string[] {
    const recommendations = {
      'hourglass': ['belted styles', 'wrap styles', 'fitted silhouettes'],
      'pear': ['A-line styles', 'empire waist', 'balanced proportions'],
      'apple': ['empire waist', 'A-line styles', 'flowing silhouettes'],
      'rectangle': ['belted styles', 'peplum styles', 'structured silhouettes'],
      'inverted-triangle': ['A-line bottoms', 'wide leg styles', 'balanced proportions']
    };

    return recommendations[proportionType] || ['classic styles', 'tailored fits'];
  }

  /**
   * Get style recommendations based on build type
   */
  private getStyleRecommendations(buildType: SafeBodyDescriptor['buildType']): string[] {
    const recommendations = {
      'lean': ['structured styles', 'layered looks', 'textured fabrics'],
      'athletic': ['tailored fits', 'structured blazers', 'fitted styles'],
      'balanced': ['versatile styles', 'classic cuts', 'timeless pieces'],
      'fuller-figure': ['flowing styles', 'draped fabrics', 'elegant silhouettes']
    };

    return recommendations[buildType] || ['classic styles', 'versatile pieces'];
  }

  /**
   * Get fit recommendations
   */
  private getFitRecommendations(fitPreference: SafeBodyDescriptor['fitPreference']): string[] {
    const recommendations = {
      'fitted': ['tailored cuts', 'structured fits', 'precise sizing'],
      'relaxed': ['comfortable fits', 'easy styles', 'flowing silhouettes'],
      'loose': ['oversized styles', 'flowing fabrics', 'comfortable fits'],
      'tailored': ['professional fits', 'structured styles', 'polished looks']
    };

    return recommendations[fitPreference] || ['classic fits', 'versatile styles'];
  }
}

// Export singleton instance
export const safeMeasurementService = new SafeMeasurementService();
export default safeMeasurementService;