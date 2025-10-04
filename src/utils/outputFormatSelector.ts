/**
 * Output Format Selector Utility
 *
 * Dynamically selects the optimal output format (PNG vs JPEG) based on:
 * - User context (try-on, save, export, etc.)
 * - User quality preference settings
 * - Device capabilities (mobile vs desktop)
 *
 * PNG: Higher quality, larger file size, transparency support
 * JPEG: Faster generation, smaller file size, no transparency
 */

export type OutputFormat = 'png' | 'jpeg';

export type QualityPreference = 'battery_saver' | 'balanced' | 'high_quality';

export type ImageContext =
  // High-quality contexts (use PNG)
  | 'avatar_creation'
  | 'closet_save'
  | 'calendar_save'
  | 'export'
  | 'share'

  // Speed-priority contexts (use JPEG)
  | 'try_on'
  | 'browse'
  | 'preview'
  | 'mobile'
  | 'quick_generate'
  | 'occasion_preview';

/**
 * Configuration for context-based format selection
 */
const HIGH_QUALITY_CONTEXTS: ImageContext[] = [
  'avatar_creation',
  'closet_save',
  'calendar_save',
  'export',
  'share'
];

const SPEED_PRIORITY_CONTEXTS: ImageContext[] = [
  'try_on',
  'browse',
  'preview',
  'mobile',
  'quick_generate',
  'occasion_preview'
];

/**
 * Get the optimal output format based on context and user preferences
 *
 * @param context - The usage context for the image
 * @param userPreference - User's quality preference setting (optional)
 * @returns The optimal output format ('png' or 'jpeg')
 */
export function getOutputFormat(
  context: ImageContext,
  userPreference?: QualityPreference
): OutputFormat {
  // User override: Battery Saver - always use JPEG
  if (userPreference === 'battery_saver') {
    console.log(`📷 [FORMAT] Battery Saver mode: JPEG for ${context}`);
    return 'jpeg';
  }

  // User override: High Quality - always use PNG
  if (userPreference === 'high_quality') {
    console.log(`📷 [FORMAT] High Quality mode: PNG for ${context}`);
    return 'png';
  }

  // Balanced mode (default): Context-based selection
  if (HIGH_QUALITY_CONTEXTS.includes(context)) {
    console.log(`📷 [FORMAT] High-quality context (${context}): PNG`);
    return 'png';
  }

  if (SPEED_PRIORITY_CONTEXTS.includes(context)) {
    console.log(`📷 [FORMAT] Speed-priority context (${context}): JPEG`);
    return 'jpeg';
  }

  // Fallback to JPEG for unknown contexts (favor speed)
  console.log(`📷 [FORMAT] Unknown context (${context}): defaulting to JPEG`);
  return 'jpeg';
}

/**
 * Get user's quality preference from localStorage or profile
 */
export function getUserQualityPreference(): QualityPreference {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.settings?.qualityPreference || 'balanced';
    }
  } catch (error) {
    console.error('Failed to get user quality preference:', error);
  }
  return 'balanced'; // Default
}

/**
 * Save user's quality preference
 */
export function setUserQualityPreference(preference: QualityPreference): void {
  try {
    const userData = localStorage.getItem('userData');
    const parsed = userData ? JSON.parse(userData) : {};

    if (!parsed.settings) {
      parsed.settings = {};
    }

    parsed.settings.qualityPreference = preference;
    localStorage.setItem('userData', JSON.stringify(parsed));

    console.log(`✅ [SETTINGS] Quality preference updated: ${preference}`);
  } catch (error) {
    console.error('Failed to save quality preference:', error);
  }
}

/**
 * Get format with automatic user preference detection
 */
export function getOutputFormatAuto(context: ImageContext): OutputFormat {
  const userPreference = getUserQualityPreference();
  return getOutputFormat(context, userPreference);
}

/**
 * Quality preference metadata for UI
 */
export const QUALITY_PREFERENCES = {
  battery_saver: {
    label: 'Battery Saver',
    description: 'Fastest generation, smaller file sizes (JPEG only)',
    icon: '🔋',
    format: 'jpeg' as OutputFormat
  },
  balanced: {
    label: 'Balanced',
    description: 'Smart selection based on usage (Recommended)',
    icon: '⚖️',
    format: 'auto' as const
  },
  high_quality: {
    label: 'High Quality',
    description: 'Best quality, larger file sizes (PNG only)',
    icon: '💎',
    format: 'png' as OutputFormat
  }
} as const;

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get recommended context based on device
 */
export function getRecommendedContext(baseContext: ImageContext): ImageContext {
  if (isMobileDevice() && !HIGH_QUALITY_CONTEXTS.includes(baseContext)) {
    return 'mobile';
  }
  return baseContext;
}

export default {
  getOutputFormat,
  getOutputFormatAuto,
  getUserQualityPreference,
  setUserQualityPreference,
  isMobileDevice,
  getRecommendedContext,
  QUALITY_PREFERENCES
};
