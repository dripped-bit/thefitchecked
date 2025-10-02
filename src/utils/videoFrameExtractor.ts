/**
 * Video frame extraction utilities for extracting static frames from generated videos
 * Used to convert Kling video outputs to static images for FASHN compatibility
 */

export interface FrameExtractionOptions {
  timeOffset?: number; // Time in seconds to extract frame from (default: 1.0)
  quality?: number; // JPEG quality 0-1 (default: 0.9)
  maxWidth?: number; // Max width for extracted frame (default: 1024)
  maxHeight?: number; // Max height for extracted frame (default: 1024)
}

export interface FrameExtractionResult {
  frameDataUrl: string;
  originalVideoUrl: string;
  timeOffset: number;
  extractionTime: number;
}

/**
 * Extract a static frame from a video URL for FASHN compatibility
 */
export async function extractVideoFrame(
  videoUrl: string,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> {
  const {
    timeOffset = 1.0,
    quality = 0.9,
    maxWidth = 1024,
    maxHeight = 1024
  } = options;

  const startTime = Date.now();

  console.log('🎬 [VIDEO-FRAME] Starting frame extraction:', {
    videoUrl: videoUrl.substring(0, 50) + '...',
    timeOffset,
    quality,
    maxWidth,
    maxHeight
  });

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context for frame extraction'));
      return;
    }

    // Set video properties
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      console.log('🎬 [VIDEO-FRAME] Video metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      // Calculate canvas dimensions while maintaining aspect ratio
      let { videoWidth, videoHeight } = video;
      const aspectRatio = videoWidth / videoHeight;

      if (videoWidth > maxWidth) {
        videoWidth = maxWidth;
        videoHeight = videoWidth / aspectRatio;
      }

      if (videoHeight > maxHeight) {
        videoHeight = maxHeight;
        videoWidth = videoHeight * aspectRatio;
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      console.log('🎬 [VIDEO-FRAME] Canvas dimensions set:', {
        width: canvas.width,
        height: canvas.height
      });
    };

    video.onseeked = () => {
      console.log('🎬 [VIDEO-FRAME] Video seeked to time:', video.currentTime);

      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const frameDataUrl = canvas.toDataURL('image/jpeg', quality);

        const extractionTime = Date.now() - startTime;

        console.log('✅ [VIDEO-FRAME] Frame extraction complete:', {
          frameSize: Math.round(frameDataUrl.length / 1024) + 'KB',
          extractionTime: extractionTime + 'ms',
          canvasDimensions: `${canvas.width}x${canvas.height}`
        });

        resolve({
          frameDataUrl,
          originalVideoUrl: videoUrl,
          timeOffset: video.currentTime,
          extractionTime
        });
      } catch (error) {
        console.error('❌ [VIDEO-FRAME] Frame extraction failed:', error);
        reject(new Error(`Frame extraction failed: ${error.message}`));
      }
    };

    video.onerror = (error) => {
      console.error('❌ [VIDEO-FRAME] Video loading failed:', error);
      reject(new Error('Failed to load video for frame extraction'));
    };

    video.oncanplaythrough = () => {
      console.log('🎬 [VIDEO-FRAME] Video can play through, seeking to time offset:', timeOffset);

      // Ensure we don't seek beyond video duration
      const seekTime = Math.min(timeOffset, video.duration - 0.1);
      video.currentTime = seekTime;
    };

    // Start loading the video
    console.log('🎬 [VIDEO-FRAME] Loading video:', videoUrl);
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Check if a URL is a video format that needs frame extraction
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Get the appropriate image URL for FASHN - extract frame if video, return as-is if image
 */
export async function getFashnCompatibleImageUrl(avatarUrl: string): Promise<string> {
  if (!avatarUrl) {
    throw new Error('No avatar URL provided');
  }

  if (isVideoUrl(avatarUrl)) {
    console.log('🎬 [VIDEO-FRAME] Video detected, extracting frame for FASHN compatibility');

    const frameResult = await extractVideoFrame(avatarUrl, {
      timeOffset: 1.0, // Extract frame at 1 second mark
      quality: 0.9,
      maxWidth: 1024,
      maxHeight: 1024
    });

    return frameResult.frameDataUrl;
  } else {
    console.log('🖼️ [VIDEO-FRAME] Static image detected, using directly');
    return avatarUrl;
  }
}