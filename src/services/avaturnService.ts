// Avaturn API service for 3D avatar generation
export interface AvaturnConfig {
  apiKey: string;
  baseUrl: string;
}

export interface Avatar3DRequest {
  photos: {
    front_upper: string;
    side_upper: string;
    back_upper: string;
    front_full: string;
    side_full: string;
    back_full: string;
  };
  measurements: {
    height: number;
    chest: number;
    waist: number;
    hips: number;
    shoulders: number;
    inseam: number;
    weight?: number;
  };
  preferences: {
    gender: 'male' | 'female' | 'other';
    bodyType: string;
    style?: string;
    quality: 'standard' | 'high' | 'ultra';
  };
  options: {
    generateAnimations: boolean;
    includeBlendshapes: boolean;
    exportFormat: 'gltf' | 'fbx' | 'obj';
    resolution: '1k' | '2k' | '4k';
  };
}

export interface Avatar3DResponse {
  avatarId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
  previewUrl?: string;
  downloadUrls?: {
    model: string;
    textures: string[];
    animations?: string[];
  };
  metadata: {
    vertices: number;
    faces: number;
    materials: number;
    bones?: number;
    animations?: string[];
  };
  error?: string;
}

export interface AvaturnProcessingStatus {
  avatarId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
  message?: string;
}

export class AvaturnService {
  private config: AvaturnConfig;
  private static readonly DEFAULT_CONFIG: AvaturnConfig = {
    apiKey: import.meta.env.VITE_AVATURN_API_KEY || '',
    baseUrl: 'https://api.avaturn.me/v1'
  };

  constructor(config?: Partial<AvaturnConfig>) {
    this.config = {
      ...AvaturnService.DEFAULT_CONFIG,
      ...config
    };

    if (!this.config.apiKey) {
      console.warn('Avaturn API key not provided. Using demo mode.');
    }
  }

  // Upload photos to Avaturn storage
  async uploadPhotos(photoFiles: { [key: string]: File }): Promise<{ [key: string]: string }> {
    const uploadedUrls: { [key: string]: string } = {};

    try {
      // Upload each photo
      for (const [pose, file] of Object.entries(photoFiles)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pose', pose);

        const response = await fetch(`${this.config.baseUrl}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${pose} photo: ${response.statusText}`);
        }

        const result = await response.json();
        uploadedUrls[pose] = result.url;
      }

      return uploadedUrls;
    } catch (error) {
      throw new Error(`Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create 3D avatar from photos and measurements
  async generateAvatar(request: Avatar3DRequest): Promise<Avatar3DResponse> {
    try {
      // If no API key, return mock response for development
      if (!this.config.apiKey) {
        return this.getMockAvatarResponse();
      }

      const response = await fetch(`${this.config.baseUrl}/avatars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return this.processAvatarResponse(result);
    } catch (error) {
      throw new Error(`Avatar generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check avatar generation status
  async getAvatarStatus(avatarId: string): Promise<AvaturnProcessingStatus> {
    try {
      // If no API key, return mock status for development
      if (!this.config.apiKey) {
        return this.getMockProcessingStatus(avatarId);
      }

      const response = await fetch(`${this.config.baseUrl}/avatars/${avatarId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Download completed avatar
  async downloadAvatar(avatarId: string): Promise<Avatar3DResponse> {
    try {
      // If no API key, return mock response for development
      if (!this.config.apiKey) {
        return this.getMockCompletedAvatar(avatarId);
      }

      const response = await fetch(`${this.config.baseUrl}/avatars/${avatarId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Poll avatar status until completion
  async waitForCompletion(
    avatarId: string,
    onProgress?: (status: AvaturnProcessingStatus) => void,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<Avatar3DResponse> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Avatar generation timed out'));
            return;
          }

          const status = await this.getAvatarStatus(avatarId);
          onProgress?.(status);

          switch (status.status) {
            case 'completed':
              const result = await this.downloadAvatar(avatarId);
              resolve(result);
              return;
            case 'failed':
              reject(new Error(status.message || 'Avatar generation failed'));
              return;
            case 'queued':
            case 'processing':
              setTimeout(poll, pollInterval);
              return;
            default:
              reject(new Error(`Unknown status: ${status.status}`));
              return;
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Validate request before sending
  validateRequest(request: Avatar3DRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required photos
    const requiredPoses = ['front_upper', 'side_upper', 'back_upper', 'front_full', 'side_full', 'back_full'];
    for (const pose of requiredPoses) {
      if (!request.photos[pose as keyof typeof request.photos]) {
        errors.push(`Missing photo for pose: ${pose}`);
      }
    }

    // Check measurements
    const requiredMeasurements = ['height', 'chest', 'waist', 'hips', 'shoulders', 'inseam'];
    for (const measurement of requiredMeasurements) {
      const value = request.measurements[measurement as keyof typeof request.measurements];
      if (!value || value <= 0) {
        errors.push(`Invalid measurement: ${measurement}`);
      }
    }

    // Check measurement ranges (in cm)
    if (request.measurements.height < 120 || request.measurements.height > 230) {
      errors.push('Height must be between 120-230cm');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to process API response
  private processAvatarResponse(apiResponse: any): Avatar3DResponse {
    return {
      avatarId: apiResponse.id || apiResponse.avatarId,
      status: apiResponse.status || 'processing',
      progress: apiResponse.progress || 0,
      estimatedTime: apiResponse.estimatedTime,
      previewUrl: apiResponse.previewUrl || apiResponse.preview_url,
      downloadUrls: apiResponse.downloadUrls || apiResponse.download_urls,
      metadata: {
        vertices: apiResponse.metadata?.vertices || 0,
        faces: apiResponse.metadata?.faces || 0,
        materials: apiResponse.metadata?.materials || 0,
        bones: apiResponse.metadata?.bones,
        animations: apiResponse.metadata?.animations
      },
      error: apiResponse.error
    };
  }

  // Mock responses for development/testing
  private getMockAvatarResponse(): Avatar3DResponse {
    const avatarId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      avatarId,
      status: 'processing',
      progress: 0,
      estimatedTime: 120, // 2 minutes
      metadata: {
        vertices: 0,
        faces: 0,
        materials: 0
      }
    };
  }

  private getMockProcessingStatus(avatarId: string): AvaturnProcessingStatus {
    // Simulate progress over time
    const elapsed = Date.now() - parseInt(avatarId.split('_')[1]);
    const totalTime = 120000; // 2 minutes
    const progress = Math.min(100, Math.floor((elapsed / totalTime) * 100));

    const stages = [
      'Initializing avatar generation',
      'Processing photos',
      'Analyzing body measurements',
      'Generating 3D mesh',
      'Creating textures',
      'Applying materials',
      'Optimizing model',
      'Finalizing avatar'
    ];

    const stageIndex = Math.floor((progress / 100) * stages.length);
    const stage = stages[Math.min(stageIndex, stages.length - 1)];

    return {
      avatarId,
      status: progress >= 100 ? 'completed' : 'processing',
      progress,
      stage,
      estimatedTimeRemaining: progress >= 100 ? 0 : Math.max(0, totalTime - elapsed),
      message: progress >= 100 ? 'Avatar generation completed!' : `${stage}...`
    };
  }

  private getMockCompletedAvatar(avatarId: string): Avatar3DResponse {
    return {
      avatarId,
      status: 'completed',
      progress: 100,
      previewUrl: '/portrait/my-new-portrait.png', // Use existing placeholder
      downloadUrls: {
        model: `https://mock-storage.avaturn.me/avatars/${avatarId}/model.gltf`,
        textures: [
          `https://mock-storage.avaturn.me/avatars/${avatarId}/diffuse.jpg`,
          `https://mock-storage.avaturn.me/avatars/${avatarId}/normal.jpg`,
          `https://mock-storage.avaturn.me/avatars/${avatarId}/roughness.jpg`
        ],
        animations: [
          `https://mock-storage.avaturn.me/avatars/${avatarId}/idle.fbx`,
          `https://mock-storage.avaturn.me/avatars/${avatarId}/walk.fbx`
        ]
      },
      metadata: {
        vertices: 8542,
        faces: 16834,
        materials: 3,
        bones: 71,
        animations: ['idle', 'walk', 'wave', 'dance']
      }
    };
  }

  // Helper to create request from captured data
  static createAvatarRequest(
    photos: any[],
    measurements: any,
    preferences: any = {}
  ): Avatar3DRequest {
    // Map photos by pose
    const photoMap: any = {};
    photos.forEach(photo => {
      const key = `${photo.pose}_${photo.id.includes('full') ? 'full' : 'upper'}`;
      photoMap[key] = photo.dataUrl || photo.file;
    });

    return {
      photos: {
        front_upper: photoMap.front_upper,
        side_upper: photoMap.side_upper,
        back_upper: photoMap.back_upper,
        front_full: photoMap.front_full,
        side_full: photoMap.side_full,
        back_full: photoMap.back_full
      },
      measurements: {
        height: measurements.height,
        chest: measurements.chest,
        waist: measurements.waist,
        hips: measurements.hips,
        shoulders: measurements.shoulders,
        inseam: measurements.inseam,
        weight: measurements.weight
      },
      preferences: {
        gender: measurements.gender,
        bodyType: preferences.bodyType || 'standard',
        style: preferences.style || 'realistic',
        quality: preferences.quality || 'high'
      },
      options: {
        generateAnimations: preferences.generateAnimations !== false,
        includeBlendshapes: preferences.includeBlendshapes !== false,
        exportFormat: preferences.exportFormat || 'gltf',
        resolution: preferences.resolution || '2k'
      }
    };
  }
}

// Export singleton instance
export const avaturnService = new AvaturnService();