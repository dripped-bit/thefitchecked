/**
 * iOS Spacing Utilities
 * Follows Apple's 8pt grid system
 * https://developer.apple.com/design/human-interface-guidelines/layout
 */

/**
 * iOS spacing scale based on 8pt grid
 * Use these values for padding, margin, gaps, etc.
 */
export const iosSpacing = {
  /** 4px - Use sparingly for very tight spacing */
  xxs: 1,
  /** 8px - Minimum spacing unit */
  xs: 2,
  /** 16px - Standard spacing */
  sm: 4,
  /** 24px - Common spacing for sections */
  md: 6,
  /** 32px - Large spacing between major sections */
  lg: 8,
  /** 48px - Extra large spacing */
  xl: 12,
  /** 64px - Maximum spacing */
  xxl: 16,
} as const;

/**
 * iOS spacing classes for Tailwind
 * Maps semantic names to Tailwind spacing scale
 */
export const iosSpacingClasses = {
  padding: {
    xxs: 'p-1',    // 4px
    xs: 'p-2',     // 8px
    sm: 'p-4',     // 16px
    md: 'p-6',     // 24px
    lg: 'p-8',     // 32px
    xl: 'p-12',    // 48px
    xxl: 'p-16',   // 64px
  },
  paddingX: {
    xxs: 'px-1',
    xs: 'px-2',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12',
    xxl: 'px-16',
  },
  paddingY: {
    xxs: 'py-1',
    xs: 'py-2',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-12',
    xxl: 'py-16',
  },
  gap: {
    xxs: 'gap-1',
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
    xxl: 'gap-16',
  },
  space: {
    xxs: 'space-y-1',
    xs: 'space-y-2',
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-12',
    xxl: 'space-y-16',
  },
} as const;

/**
 * Migration guide for existing spacing to iOS 8pt grid
 */
export const spacingMigrationMap = {
  // Padding
  'p-1': 'p-2',   // 4px → 8px
  'p-3': 'p-4',   // 12px → 16px
  'p-5': 'p-6',   // 20px → 24px
  'p-7': 'p-8',   // 28px → 32px

  // Gap
  'gap-1': 'gap-2',
  'gap-3': 'gap-4',
  'gap-5': 'gap-6',
  'gap-7': 'gap-8',

  // Space
  'space-y-1': 'space-y-2',
  'space-y-3': 'space-y-4',
  'space-y-5': 'space-y-6',
  'space-y-7': 'space-y-8',

  'space-x-1': 'space-x-2',
  'space-x-3': 'space-x-4',
  'space-x-5': 'space-x-6',
  'space-x-7': 'space-x-8',
} as const;

/**
 * Helper function to get iOS-compliant spacing class
 * @param size - Semantic size name
 * @param type - Type of spacing (padding, gap, space, etc.)
 * @returns Tailwind spacing class
 */
export function getIOSSpacing(
  size: keyof typeof iosSpacing,
  type: 'padding' | 'paddingX' | 'paddingY' | 'gap' | 'space' = 'padding'
): string {
  return iosSpacingClasses[type][size];
}

/**
 * Common iOS spacing patterns
 */
export const iosSpacingPatterns = {
  /** Content margins from screen edges */
  contentMargin: 'px-4',       // 16px
  /** Content margins for larger screens */
  contentMarginLg: 'px-6',     // 24px
  /** Section spacing */
  sectionGap: 'space-y-6',     // 24px
  /** Card padding */
  cardPadding: 'p-4',          // 16px
  /** Modal padding */
  modalPadding: 'p-6',         // 24px
  /** List item padding */
  listItemPadding: 'px-4 py-3', // 16px horizontal, 12px vertical (exception for list items)
  /** Button padding */
  buttonPadding: {
    sm: 'px-3 py-1.5',         // Small: 12px x 6px
    md: 'px-5 py-3',           // Medium: 20px x 12px (exception for ergonomics)
    lg: 'px-6 py-4',           // Large: 24px x 16px
  },
  /** Input padding */
  inputPadding: 'px-4 py-3',   // 16px x 12px
  /** Icon button spacing */
  iconButtonSize: 'p-2',       // 8px (with 44pt min touch target)
} as const;

/**
 * Border radius following iOS standards
 */
export const iosBorderRadius = {
  /** Small controls (toggles, tags) */
  sm: 'rounded-lg',            // 8px
  /** Standard (buttons, inputs) */
  md: 'rounded-xl',            // 12px
  /** Cards, modals */
  lg: 'rounded-2xl',           // 16px
  /** Bottom sheets (top corners only) */
  sheet: 'rounded-t-3xl',      // 24px
  /** Pills (maximum radius) */
  pill: 'rounded-full',        // 999px
} as const;

/**
 * iOS safe area utilities
 * For handling iPhone notch and home indicator
 */
export const iosSafeArea = {
  /** Top safe area (for fixed headers) */
  top: 'pt-safe',
  /** Bottom safe area (for fixed footers/tab bars) */
  bottom: 'pb-safe',
  /** Both top and bottom */
  both: 'pt-safe pb-safe',
  /** Add safe area to existing padding */
  paddingTop: 'ios-safe-area-top',
  paddingBottom: 'ios-safe-area-bottom',
} as const;

export default {
  iosSpacing,
  iosSpacingClasses,
  spacingMigrationMap,
  getIOSSpacing,
  iosSpacingPatterns,
  iosBorderRadius,
  iosSafeArea,
};
