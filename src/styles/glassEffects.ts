/**
 * iOS Liquid Glass Effect Utilities
 * Provides reusable styling for navigation and control elements
 * DO NOT apply to content areas (photos, grids, etc.)
 */

export interface GlassEffectOptions {
  mode?: 'light' | 'dark';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  shadow?: boolean;
}

/**
 * Get Tailwind classes for glass effect
 */
export const getGlassClasses = (options: GlassEffectOptions = {}): string => {
  const {
    mode = 'light',
    blur = 'xl',
    border = true,
    shadow = true
  } = options;

  const baseClasses = [
    'backdrop-blur-' + blur,
    'backdrop-saturate-180',
    'transition-all',
    'duration-300'
  ];

  // Background color with transparency
  if (mode === 'light') {
    baseClasses.push('bg-white/70');
  } else {
    baseClasses.push('bg-gray-900/70');
  }

  // Border
  if (border) {
    baseClasses.push('border', 'border-white/20');
  }

  // Shadow
  if (shadow) {
    baseClasses.push('shadow-lg', 'shadow-black/10');
  }

  return baseClasses.join(' ');
};

/**
 * Glass effect for navigation bars (top/bottom)
 */
export const glassNavClasses = {
  light: 'bg-white/70 backdrop-blur-xl backdrop-saturate-180 border-white/20 transition-all duration-300',
  dark: 'bg-gray-900/70 backdrop-blur-xl backdrop-saturate-180 border-white/10 transition-all duration-300'
};

/**
 * Glass effect for modal containers
 */
export const glassModalClasses = {
  light: 'bg-white/70 backdrop-blur-xl backdrop-saturate-180 border border-white/20 rounded-2xl shadow-lg shadow-black/10 transition-all duration-300',
  dark: 'bg-gray-900/70 backdrop-blur-xl backdrop-saturate-180 border border-white/10 rounded-2xl shadow-lg shadow-black/30 transition-all duration-300'
};

/**
 * Glass effect for action buttons
 */
export const glassButtonClasses = {
  light: 'bg-white/60 backdrop-blur-md backdrop-saturate-180 border border-white/30 hover:bg-white/80 active:bg-white/90 transition-all duration-200',
  dark: 'bg-gray-800/60 backdrop-blur-md backdrop-saturate-180 border border-white/20 hover:bg-gray-800/80 active:bg-gray-800/90 transition-all duration-200'
};

/**
 * Glass effect for toolbars
 */
export const glassToolbarClasses = {
  light: 'bg-white/50 backdrop-blur-lg backdrop-saturate-180 border-white/20 transition-all duration-300',
  dark: 'bg-gray-900/50 backdrop-blur-lg backdrop-saturate-180 border-white/10 transition-all duration-300'
};

/**
 * CSS-in-JS style object for glass effect (for inline styles)
 */
export const glassStyle = (mode: 'light' | 'dark' = 'light'): React.CSSProperties => ({
  background: mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(28, 28, 30, 0.7)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${mode === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
  borderRadius: '16px',
  boxShadow: mode === 'light'
    ? '0 8px 32px rgba(0, 0, 0, 0.1)'
    : '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease'
});

/**
 * Glass effect for bottom navigation (with safe area)
 */
export const glassBottomNavStyle = (mode: 'light' | 'dark' = 'light'): React.CSSProperties => ({
  ...glassStyle(mode),
  paddingBottom: 'env(safe-area-inset-bottom)',
  borderBottomLeftRadius: '0',
  borderBottomRightRadius: '0'
});

/**
 * Glass effect for top navigation
 */
export const glassTopNavStyle = (mode: 'light' | 'dark' = 'light'): React.CSSProperties => ({
  ...glassStyle(mode),
  paddingTop: 'env(safe-area-inset-top)',
  borderTopLeftRadius: '0',
  borderTopRightRadius: '0'
});

/**
 * Helper to check if dark mode is enabled
 */
export const isDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/**
 * Get appropriate glass classes based on system theme
 */
export const getAutoGlassClasses = (type: 'nav' | 'modal' | 'button' | 'toolbar'): string => {
  const dark = isDarkMode();

  switch (type) {
    case 'nav':
      return dark ? glassNavClasses.dark : glassNavClasses.light;
    case 'modal':
      return dark ? glassModalClasses.dark : glassModalClasses.light;
    case 'button':
      return dark ? glassButtonClasses.dark : glassButtonClasses.light;
    case 'toolbar':
      return dark ? glassToolbarClasses.dark : glassToolbarClasses.light;
    default:
      return '';
  }
};
