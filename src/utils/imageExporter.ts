/**
 * Image Exporter Utility
 * Exports outfit images with optional privacy features (face blur, watermark)
 */

export interface ExportOptions {
  hideFace?: boolean;
  outfitOnly?: boolean;
  addWatermark?: boolean;
  fileName?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
}

class ImageExporter {
  /**
   * Download outfit image
   */
  async downloadImage(
    imageUrl: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      hideFace = false,
      addWatermark = true,
      fileName = `outfit-${Date.now()}`,
      format = 'png',
      quality = 0.95
    } = options;

    try {
      // Load image
      const img = await this.loadImage(imageUrl);

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply face blur if requested
      if (hideFace) {
        this.blurFaceArea(ctx, canvas.width, canvas.height);
      }

      // Add watermark if requested
      if (addWatermark) {
        this.addWatermark(ctx, canvas.width, canvas.height);
      }

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.${format}`;
          link.click();

          // Cleanup
          URL.revokeObjectURL(url);
        },
        `image/${format}`,
        quality
      );

      console.log('✅ Image downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download image:', error);
      throw error;
    }
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Blur face area (top 30% of image)
   */
  private blurFaceArea(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const faceHeight = height * 0.3;

    // Get face area image data
    const imageData = ctx.getImageData(0, 0, width, faceHeight);

    // Apply blur effect
    this.applyGaussianBlur(imageData, 20);

    // Put blurred image data back
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply Gaussian blur to image data
   */
  private applyGaussianBlur(imageData: ImageData, radius: number): void {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Simple box blur (faster than true Gaussian)
    const kernel = this.createBlurKernel(radius);
    const halfKernel = Math.floor(kernel.length / 2);

    const copy = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const px = x + kx;
            const py = y + ky;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const i = (py * width + px) * 4;
              r += copy[i];
              g += copy[i + 1];
              b += copy[i + 2];
              a += copy[i + 3];
              count++;
            }
          }
        }

        const i = (y * width + x) * 4;
        pixels[i] = r / count;
        pixels[i + 1] = g / count;
        pixels[i + 2] = b / count;
        pixels[i + 3] = a / count;
      }
    }
  }

  /**
   * Create blur kernel
   */
  private createBlurKernel(radius: number): number[] {
    const size = radius * 2 + 1;
    return new Array(size).fill(1 / size);
  }

  /**
   * Add watermark to image
   */
  private addWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const text = 'FitChecked';
    const fontSize = Math.max(16, Math.floor(width * 0.03));

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;

    // Position watermark in bottom right
    const metrics = ctx.measureText(text);
    const x = width - metrics.width - 20;
    const y = height - 20;

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /**
   * Create shareable image with outfit details overlay
   */
  async createShareableImage(
    imageUrl: string,
    outfitDetails: {
      occasion?: string;
      weather?: string;
      formality?: string;
    },
    options: ExportOptions = {}
  ): Promise<string> {
    const img = await this.loadImage(imageUrl);

    const canvas = document.createElement('canvas');
    const padding = 40;
    const overlayHeight = 100;

    canvas.width = img.width;
    canvas.height = img.height + overlayHeight + padding * 2;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, padding, padding);

    // Apply privacy settings
    if (options.hideFace) {
      this.blurFaceArea(ctx, img.width, img.height);
    }

    // Draw outfit details overlay
    const overlayY = img.height + padding * 2;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, overlayY, canvas.width, overlayHeight);

    // Draw text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(outfitDetails.occasion || 'My Outfit', padding, overlayY + 35);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#6b7280';
    let textY = overlayY + 60;

    if (outfitDetails.formality) {
      ctx.fillText(`${outfitDetails.formality} Attire`, padding, textY);
      textY += 25;
    }

    if (outfitDetails.weather) {
      ctx.fillText(outfitDetails.weather, padding, textY);
    }

    // Add watermark
    if (options.addWatermark !== false) {
      this.addWatermark(ctx, canvas.width, canvas.height);
    }

    // Return as data URL
    return canvas.toDataURL('image/png', options.quality || 0.95);
  }

  /**
   * Share image via Web Share API (mobile)
   */
  async shareImage(imageUrl: string, title: string = 'My Outfit'): Promise<boolean> {
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      const blob = await fetch(imageUrl).then(r => r.blob());
      const file = new File([blob], 'outfit.png', { type: 'image/png' });

      await navigator.share({
        title,
        files: [file]
      });

      return true;
    } catch (error) {
      console.error('Failed to share image:', error);
      return false;
    }
  }
}

const imageExporter = new ImageExporter();
export default imageExporter;
