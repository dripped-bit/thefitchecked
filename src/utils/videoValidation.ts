/**
 * Video URL Validation Utility
 *
 * Provides robust validation for video URLs to prevent loading errors
 * in video elements by checking actual content types and formats.
 */

export interface VideoValidationResult {
  isValidVideo: boolean;
  contentType?: string;
  error?: string;
  recommendFallback: boolean;
}

export class VideoURLValidator {

  /**
   * Check if a URL appears to be a video based on extension and patterns
   */
  static isLikelyVideoURL(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Don't treat data URLs as videos unless they explicitly contain video data
    if (url.startsWith('data:')) {
      return url.startsWith('data:video/');
    }

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'];
    const videoPlatforms = ['kling', 'fal.ai/video', 'runway', 'pika'];

    const urlLower = url.toLowerCase();

    // Check file extensions
    const hasVideoExtension = videoExtensions.some(ext => urlLower.includes(ext));

    // Check for known video platforms
    const isVideoPlatform = videoPlatforms.some(platform => urlLower.includes(platform));

    return hasVideoExtension || isVideoPlatform;
  }

  /**
   * Validate if URL can actually be loaded as video content
   */
  static async validateVideoURL(url: string): Promise<VideoValidationResult> {
    if (!url || typeof url !== 'string') {
      return {
        isValidVideo: false,
        error: 'Invalid URL provided',
        recommendFallback: true
      };
    }

    // Skip validation for data URLs - let browser handle them
    if (url.startsWith('data:')) {
      return {
        isValidVideo: url.startsWith('data:video/'),
        contentType: url.startsWith('data:video/') ? 'video/mp4' : 'unknown',
        recommendFallback: !url.startsWith('data:video/')
      };
    }

    try {
      // For HTTP(S) URLs, try to check headers
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors'
      });

      const contentType = response.headers.get('content-type') || '';
      const isVideo = contentType.startsWith('video/');

      return {
        isValidVideo: isVideo,
        contentType: contentType,
        recommendFallback: !isVideo
      };

    } catch (error) {
      console.warn('🔍 [VIDEO-VALIDATOR] Cannot validate URL headers:', error);

      // Fallback to URL pattern matching
      const isLikelyVideo = this.isLikelyVideoURL(url);

      return {
        isValidVideo: isLikelyVideo,
        error: `Header check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendFallback: !isLikelyVideo
      };
    }
  }

  /**
   * Quick synchronous check for obvious video indicators
   */
  static quickVideoCheck(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Data URLs must explicitly be video type
    if (url.startsWith('data:')) {
      return url.startsWith('data:video/');
    }

    return this.isLikelyVideoURL(url);
  }

  /**
   * Check if URL is safe to attempt video loading
   */
  static isSafeVideoURL(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Check for common problematic patterns
    const problematicPatterns = [
      'blob:',
      'file:',
      'chrome-extension:',
      'moz-extension:'
    ];

    return !problematicPatterns.some(pattern => url.startsWith(pattern));
  }
}

/**
 * Enhanced video loading utility with timeout and fallback support
 */
export class VideoLoader {

  static async canPlayVideo(url: string, timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      let resolved = false;

      const cleanup = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
        video.src = '';
      };

      const resolveOnce = (result: boolean) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(result);
      };

      const onCanPlay = () => resolveOnce(true);
      const onError = () => resolveOnce(false);

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);

      // Set timeout
      setTimeout(() => resolveOnce(false), timeout);

      try {
        video.src = url;
        video.load();
      } catch (error) {
        resolveOnce(false);
      }
    });
  }
}