// Body proportion calculation and validation utilities
export interface BodyMeasurements {
  height: number; // in cm
  chest: number; // in cm
  waist: number; // in cm
  hips: number; // in cm
  shoulders: number; // in cm
  inseam: number; // in cm
  weight?: number; // in kg (optional)
  age?: number; // age (optional)
  gender: 'male' | 'female' | 'other';
}

export interface ProportionValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  corrections: BodyMeasurements;
  bodyType: string;
  recommendations: string[];
}

export interface AnthropometricRatios {
  chestToHeight: number;
  waistToHeight: number;
  hipsToHeight: number;
  shouldersToHeight: number;
  inseamToHeight: number;
  waistToChest: number;
  hipsToWaist: number;
  shouldersToChest: number;
}

export class ProportionCalculator {
  // Standard anthropometric ratios based on research data
  private static readonly STANDARD_RATIOS = {
    male: {
      chestToHeight: { min: 0.48, ideal: 0.52, max: 0.58 },
      waistToHeight: { min: 0.42, ideal: 0.47, max: 0.53 },
      hipsToHeight: { min: 0.48, ideal: 0.52, max: 0.56 },
      shouldersToHeight: { min: 0.21, ideal: 0.24, max: 0.27 },
      inseamToHeight: { min: 0.43, ideal: 0.47, max: 0.51 },
      waistToChest: { min: 0.75, ideal: 0.85, max: 1.0 },
      hipsToWaist: { min: 0.95, ideal: 1.05, max: 1.15 },
      shouldersToChest: { min: 0.40, ideal: 0.45, max: 0.52 }
    },
    female: {
      chestToHeight: { min: 0.46, ideal: 0.50, max: 0.56 },
      waistToHeight: { min: 0.38, ideal: 0.42, max: 0.48 },
      hipsToHeight: { min: 0.50, ideal: 0.55, max: 0.60 },
      shouldersToHeight: { min: 0.19, ideal: 0.22, max: 0.25 },
      inseamToHeight: { min: 0.43, ideal: 0.47, max: 0.51 },
      waistToChest: { min: 0.65, ideal: 0.75, max: 0.90 },
      hipsToWaist: { min: 1.15, ideal: 1.25, max: 1.40 },
      shouldersToChest: { min: 0.38, ideal: 0.42, max: 0.48 }
    }
  };

  // Body type classifications
  private static readonly BODY_TYPES = {
    male: {
      ectomorph: { waistToChest: [0.75, 0.85], description: "Lean, narrow build" },
      mesomorph: { waistToChest: [0.85, 0.95], description: "Athletic, muscular build" },
      endomorph: { waistToChest: [0.95, 1.10], description: "Broader, rounder build" }
    },
    female: {
      pear: { hipsToWaist: [1.25, 1.50], description: "Hips wider than bust" },
      apple: { waistToChest: [0.80, 1.00], description: "Waist similar to bust" },
      hourglass: { hipsToWaist: [1.15, 1.35], waistToChest: [0.65, 0.80], description: "Balanced bust and hips" },
      rectangle: { hipsToWaist: [1.00, 1.15], waistToChest: [0.75, 0.90], description: "Similar bust, waist, and hips" },
      inverted_triangle: { shouldersToChest: [0.42, 0.55], description: "Shoulders wider than hips" }
    }
  };

  static validateMeasurements(measurements: BodyMeasurements): ProportionValidationResult {
    const ratios = this.calculateRatios(measurements);
    const standards = this.STANDARD_RATIOS[measurements.gender === 'other' ? 'male' : measurements.gender];

    let score = 100;
    const issues: string[] = [];
    const corrections: BodyMeasurements = { ...measurements };

    // Validate each ratio
    Object.entries(ratios).forEach(([ratio, value]) => {
      const standard = standards[ratio as keyof typeof standards];
      if (standard) {
        if (value < standard.min || value > standard.max) {
          const severity = this.calculateSeverity(value, standard);
          score -= severity * 15; // Deduct points based on severity
          issues.push(this.generateIssueMessage(ratio, value, standard, measurements.gender));

          // Generate correction
          this.applyCorrection(corrections, ratio, standard, measurements);
        }
      }
    });

    // Determine body type
    const bodyType = this.determineBodyType(measurements, ratios);

    // Generate recommendations
    const recommendations = this.generateRecommendations(measurements, ratios, issues);

    return {
      isValid: score >= 70, // Minimum acceptable score
      score: Math.max(0, Math.round(score)),
      issues,
      corrections,
      bodyType,
      recommendations
    };
  }

  private static calculateRatios(measurements: BodyMeasurements): AnthropometricRatios {
    return {
      chestToHeight: measurements.chest / measurements.height,
      waistToHeight: measurements.waist / measurements.height,
      hipsToHeight: measurements.hips / measurements.height,
      shouldersToHeight: measurements.shoulders / measurements.height,
      inseamToHeight: measurements.inseam / measurements.height,
      waistToChest: measurements.waist / measurements.chest,
      hipsToWaist: measurements.hips / measurements.waist,
      shouldersToChest: measurements.shoulders / measurements.chest
    };
  }

  private static calculateSeverity(value: number, standard: { min: number; ideal: number; max: number }): number {
    const range = standard.max - standard.min;
    const idealDistance = Math.abs(value - standard.ideal);
    const maxDistance = Math.max(
      Math.abs(standard.min - standard.ideal),
      Math.abs(standard.max - standard.ideal)
    );

    if (value >= standard.min && value <= standard.max) {
      return idealDistance / maxDistance * 0.5; // Minor deviation within range
    } else {
      const outsideDistance = value < standard.min
        ? standard.min - value
        : value - standard.max;
      return Math.min(1.0, 0.5 + (outsideDistance / range)); // Major deviation outside range
    }
  }

  private static generateIssueMessage(
    ratio: string,
    value: number,
    standard: { min: number; ideal: number; max: number },
    gender: string
  ): string {
    const ratioNames: { [key: string]: string } = {
      chestToHeight: 'chest-to-height ratio',
      waistToHeight: 'waist-to-height ratio',
      hipsToHeight: 'hips-to-height ratio',
      shouldersToHeight: 'shoulder-to-height ratio',
      inseamToHeight: 'inseam-to-height ratio',
      waistToChest: 'waist-to-chest ratio',
      hipsToWaist: 'hips-to-waist ratio',
      shouldersToChest: 'shoulder-to-chest ratio'
    };

    const ratioName = ratioNames[ratio] || ratio;
    const percentage = Math.round(value * 100);
    const idealPercentage = Math.round(standard.ideal * 100);

    if (value < standard.min) {
      return `${ratioName} (${percentage}%) is below typical range. Expected around ${idealPercentage}%`;
    } else if (value > standard.max) {
      return `${ratioName} (${percentage}%) is above typical range. Expected around ${idealPercentage}%`;
    } else {
      return `${ratioName} could be optimized for better proportions`;
    }
  }

  private static applyCorrection(
    corrections: BodyMeasurements,
    ratio: string,
    standard: { min: number; ideal: number; max: number },
    original: BodyMeasurements
  ): void {
    // Apply conservative corrections toward ideal ratios
    switch (ratio) {
      case 'chestToHeight':
        corrections.chest = Math.round(original.height * standard.ideal);
        break;
      case 'waistToHeight':
        corrections.waist = Math.round(original.height * standard.ideal);
        break;
      case 'hipsToHeight':
        corrections.hips = Math.round(original.height * standard.ideal);
        break;
      case 'shouldersToHeight':
        corrections.shoulders = Math.round(original.height * standard.ideal);
        break;
      case 'inseamToHeight':
        corrections.inseam = Math.round(original.height * standard.ideal);
        break;
      case 'waistToChest':
        // Prefer adjusting waist over chest for this ratio
        corrections.waist = Math.round(original.chest * standard.ideal);
        break;
      case 'hipsToWaist':
        // Prefer adjusting hips for this ratio
        corrections.hips = Math.round(original.waist * standard.ideal);
        break;
    }
  }

  private static determineBodyType(measurements: BodyMeasurements, ratios: AnthropometricRatios): string {
    const bodyTypes = this.BODY_TYPES[measurements.gender === 'other' ? 'male' : measurements.gender];

    if (measurements.gender === 'female' || measurements.gender === 'other') {
      // Female body type classification
      const hipWaistRatio = ratios.hipsToWaist;
      const waistChestRatio = ratios.waistToChest;
      const shoulderChestRatio = ratios.shouldersToChest;

      if (hipWaistRatio >= 1.25 && waistChestRatio <= 0.80) {
        return `Pear - ${bodyTypes.pear?.description}`;
      } else if (waistChestRatio >= 0.80 && hipWaistRatio <= 1.15) {
        return `Apple - ${bodyTypes.apple?.description}`;
      } else if (hipWaistRatio >= 1.15 && hipWaistRatio <= 1.35 && waistChestRatio <= 0.80) {
        return `Hourglass - ${bodyTypes.hourglass?.description}`;
      } else if (hipWaistRatio >= 1.00 && hipWaistRatio <= 1.15) {
        return `Rectangle - ${bodyTypes.rectangle?.description}`;
      } else if (shoulderChestRatio >= 0.42) {
        return `Inverted Triangle - ${bodyTypes.inverted_triangle?.description}`;
      }
    } else {
      // Male body type classification
      const waistChestRatio = ratios.waistToChest;

      if (waistChestRatio <= 0.85) {
        return `Ectomorph - ${bodyTypes.ectomorph?.description}`;
      } else if (waistChestRatio <= 0.95) {
        return `Mesomorph - ${bodyTypes.mesomorph?.description}`;
      } else {
        return `Endomorph - ${bodyTypes.endomorph?.description}`;
      }
    }

    return 'Unique body type';
  }

  private static generateRecommendations(
    measurements: BodyMeasurements,
    ratios: AnthropometricRatios,
    issues: string[]
  ): string[] {
    const recommendations: string[] = [];

    // General measurement tips
    if (issues.length > 3) {
      recommendations.push('Consider remeasuring with a flexible measuring tape for better accuracy');
      recommendations.push('Ensure measurements are taken while standing straight with good posture');
    }

    // Specific ratio recommendations
    if (ratios.waistToHeight > 0.5) {
      recommendations.push('Focus on core measurements for accurate waist sizing');
    }

    if (ratios.shouldersToHeight < 0.2) {
      recommendations.push('Measure shoulders at the widest point, typically at the deltoid muscles');
    }

    if (ratios.inseamToHeight < 0.4 || ratios.inseamToHeight > 0.55) {
      recommendations.push('Inseam should be measured from crotch to ankle bone while standing');
    }

    // Body type specific recommendations
    if (measurements.gender === 'female') {
      if (ratios.hipsToWaist < 1.1) {
        recommendations.push('Ensure hip measurement is taken at the widest point of the hips');
      }
    }

    // BMI-related recommendations if weight is provided
    if (measurements.weight) {
      const bmi = measurements.weight / Math.pow(measurements.height / 100, 2);
      if (bmi < 18.5) {
        recommendations.push('Measurements suggest underweight BMI - ensure accurate weight measurement');
      } else if (bmi > 30) {
        recommendations.push('Measurements suggest higher BMI - double-check waist and chest measurements');
      }
    }

    return recommendations;
  }

  // Convert measurements between units
  static convertMeasurements(
    measurements: any,
    fromUnit: 'cm' | 'inches',
    toUnit: 'cm' | 'inches'
  ): BodyMeasurements {
    if (fromUnit === toUnit) return measurements;

    const conversionFactor = fromUnit === 'cm' ? 0.393701 : 2.54;

    return {
      ...measurements,
      height: Math.round(measurements.height * conversionFactor),
      chest: Math.round(measurements.chest * conversionFactor),
      waist: Math.round(measurements.waist * conversionFactor),
      hips: Math.round(measurements.hips * conversionFactor),
      shoulders: Math.round(measurements.shoulders * conversionFactor),
      inseam: Math.round(measurements.inseam * conversionFactor),
      weight: measurements.weight // Weight conversion handled separately
    };
  }

  // Parse measurement strings (e.g., "5'8\"" or "173cm")
  static parseMeasurementString(input: string): { value: number; unit: 'cm' | 'inches' } | null {
    // Remove all whitespace
    const cleaned = input.replace(/\s/g, '');

    // Pattern for feet and inches (e.g., "5'8\"" or "5'8" or "5ft8in")
    const feetInchesPattern = /^(\d+)(?:'|ft)(\d*\.?\d*)(?:"|in)?$/;
    const feetInchesMatch = cleaned.match(feetInchesPattern);

    if (feetInchesMatch) {
      const feet = parseInt(feetInchesMatch[1]);
      const inches = parseFloat(feetInchesMatch[2] || '0');
      return { value: feet * 12 + inches, unit: 'inches' };
    }

    // Pattern for centimeters
    const cmPattern = /^(\d+\.?\d*)cm$/;
    const cmMatch = cleaned.match(cmPattern);

    if (cmMatch) {
      return { value: parseFloat(cmMatch[1]), unit: 'cm' };
    }

    // Pattern for inches only
    const inchesPattern = /^(\d+\.?\d*)(?:"|in)?$/;
    const inchesMatch = cleaned.match(inchesPattern);

    if (inchesMatch) {
      const value = parseFloat(inchesMatch[1]);
      // Assume cm if value is over 50 (likely height in cm)
      if (value > 50) {
        return { value, unit: 'cm' };
      } else {
        return { value, unit: 'inches' };
      }
    }

    return null;
  }

  // Generate ideal measurements based on height and gender
  static generateIdealMeasurements(height: number, gender: 'male' | 'female' | 'other'): BodyMeasurements {
    const ratios = this.STANDARD_RATIOS[gender === 'other' ? 'male' : gender];

    return {
      height,
      chest: Math.round(height * ratios.chestToHeight.ideal),
      waist: Math.round(height * ratios.waistToHeight.ideal),
      hips: Math.round(height * ratios.hipsToHeight.ideal),
      shoulders: Math.round(height * ratios.shouldersToHeight.ideal),
      inseam: Math.round(height * ratios.inseamToHeight.ideal),
      gender
    };
  }
}