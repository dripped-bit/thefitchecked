import Vibrant from 'node-vibrant';

/**
 * Color Analysis Service
 * Extracts and analyzes colors from outfit images for better recommendations
 */

export interface ColorPalette {
  vibrant?: string;
  muted?: string;
  darkVibrant?: string;
  darkMuted?: string;
  lightVibrant?: string;
  lightMuted?: string;
}

export interface ColorAnalysis {
  primaryColors: string[];
  palette: ColorPalette;
  dominantColor: string;
  colorFamily: string;
  brightness: 'light' | 'medium' | 'dark';
  saturation: 'vibrant' | 'muted' | 'neutral';
}

class ColorAnalysisService {
  /**
   * Extract color palette from image URL
   */
  async extractColors(imageUrl: string): Promise<ColorPalette | null> {
    try {
      console.log('🎨 [COLOR-ANALYSIS] Extracting colors from image...');

      const palette = await Vibrant.from(imageUrl).getPalette();

      const colorPalette: ColorPalette = {
        vibrant: palette.Vibrant?.hex,
        muted: palette.Muted?.hex,
        darkVibrant: palette.DarkVibrant?.hex,
        darkMuted: palette.DarkMuted?.hex,
        lightVibrant: palette.LightVibrant?.hex,
        lightMuted: palette.LightMuted?.hex
      };

      console.log('✅ [COLOR-ANALYSIS] Colors extracted:', colorPalette);
      return colorPalette;
    } catch (error) {
      console.error('❌ [COLOR-ANALYSIS] Failed to extract colors:', error);
      return null;
    }
  }

  /**
   * Get primary colors array (3-5 most prominent colors)
   */
  getPrimaryColors(palette: ColorPalette): string[] {
    const colors: string[] = [];

    // Add colors in order of prominence
    if (palette.vibrant) colors.push(palette.vibrant);
    if (palette.darkVibrant) colors.push(palette.darkVibrant);
    if (palette.lightVibrant) colors.push(palette.lightVibrant);
    if (palette.muted) colors.push(palette.muted);
    if (palette.darkMuted) colors.push(palette.darkMuted);

    // Return up to 5 colors
    return colors.slice(0, 5);
  }

  /**
   * Analyze color and determine color family
   */
  getColorFamily(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 'unknown';

    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Grayscale detection
    if (max - min < 30) {
      if (max < 85) return 'black';
      if (max > 170) return 'white';
      return 'gray';
    }

    // Color families based on dominant channel
    if (r > g && r > b) {
      if (g > b) return 'orange';
      return 'red';
    } else if (g > r && g > b) {
      if (r > b) return 'yellow';
      return 'green';
    } else if (b > r && b > g) {
      if (r > g) return 'purple';
      return 'blue';
    }

    return 'mixed';
  }

  /**
   * Calculate brightness level
   */
  getBrightness(hexColor: string): 'light' | 'medium' | 'dark' {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 'medium';

    // Calculate perceived brightness
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    if (brightness > 170) return 'light';
    if (brightness < 85) return 'dark';
    return 'medium';
  }

  /**
   * Calculate saturation level
   */
  getSaturation(hexColor: string): 'vibrant' | 'muted' | 'neutral' {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 'neutral';

    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const saturation = max === 0 ? 0 : delta / max;

    if (saturation > 0.6) return 'vibrant';
    if (saturation < 0.2) return 'neutral';
    return 'muted';
  }

  /**
   * Perform full color analysis
   */
  async analyzeImage(imageUrl: string): Promise<ColorAnalysis | null> {
    try {
      const palette = await this.extractColors(imageUrl);
      if (!palette) return null;

      const primaryColors = this.getPrimaryColors(palette);
      const dominantColor = palette.vibrant || palette.muted || primaryColors[0] || '#000000';

      return {
        primaryColors,
        palette,
        dominantColor,
        colorFamily: this.getColorFamily(dominantColor),
        brightness: this.getBrightness(dominantColor),
        saturation: this.getSaturation(dominantColor)
      };
    } catch (error) {
      console.error('❌ [COLOR-ANALYSIS] Failed to analyze image:', error);
      return null;
    }
  }

  /**
   * Find complementary colors
   */
  getComplementaryColor(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return hexColor;

    // Calculate complementary color (180 degrees on color wheel)
    const complementary = {
      r: 255 - rgb.r,
      g: 255 - rgb.g,
      b: 255 - rgb.b
    };

    return this.rgbToHex(complementary.r, complementary.g, complementary.b);
  }

  /**
   * Check if two colors are similar
   */
  areColorsSimilar(color1: string, color2: string, threshold: number = 50): boolean {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return false;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );

    return distance < threshold;
  }

  /**
   * Get color name for display
   */
  getColorName(hexColor: string): string {
    const family = this.getColorFamily(hexColor);
    const brightness = this.getBrightness(hexColor);
    const saturation = this.getSaturation(hexColor);

    if (family === 'black' || family === 'white' || family === 'gray') {
      return family;
    }

    // Construct descriptive name
    let name = '';
    if (brightness === 'light') name = 'light ';
    else if (brightness === 'dark') name = 'dark ';

    if (saturation === 'vibrant') name += 'vibrant ';
    else if (saturation === 'muted') name += 'muted ';

    name += family;

    return name.trim();
  }

  /**
   * Helper: Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Helper: Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Get color harmony suggestions (analogous, triadic, etc.)
   */
  getColorHarmony(hexColor: string): {
    analogous: string[];
    triadic: string[];
    tetradic: string[];
  } {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) {
      return {
        analogous: [],
        triadic: [],
        tetradic: []
      };
    }

    // Convert to HSL for easier color harmony calculations
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Analogous: +/- 30 degrees
    const analogous = [
      this.hslToRgbHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      this.hslToRgbHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l)
    ];

    // Triadic: 120 degrees apart
    const triadic = [
      this.hslToRgbHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      this.hslToRgbHex((hsl.h + 240) % 360, hsl.s, hsl.l)
    ];

    // Tetradic: 90 degrees apart
    const tetradic = [
      this.hslToRgbHex((hsl.h + 90) % 360, hsl.s, hsl.l),
      this.hslToRgbHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      this.hslToRgbHex((hsl.h + 270) % 360, hsl.s, hsl.l)
    ];

    return { analogous, triadic, tetradic };
  }

  /**
   * Helper: RGB to HSL
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }

    return { h, s, l };
  }

  /**
   * Helper: HSL to RGB hex
   */
  private hslToRgbHex(h: number, s: number, l: number): string {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return this.rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  }
}

// Singleton instance
export const colorAnalysisService = new ColorAnalysisService();
export default colorAnalysisService;
