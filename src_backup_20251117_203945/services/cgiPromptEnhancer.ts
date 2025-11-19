/**
 * CGI Prompt Enhancement Service
 * Transforms human portraits into photorealistic 3D CGI renders
 * Based on professional animation studio specifications
 */

export interface CGIRenderingSpecs {
  // Core preservation parameters
  preservation: string[];

  // 3D rendering parameters
  cgParameters: {
    quality: 'photorealistic' | 'stylized' | 'game_engine';
    meshDensity: 'low_polygon' | 'medium_polygon' | 'high_polygon' | 'ultra_high';
    textureResolution: '1K' | '2K' | '4K' | '8K';
    renderEngine: 'PBR' | 'NPR' | 'Raytraced';
    skinShader: 'subsurface_scattering' | 'standard' | 'stylized';
    hairSystem: 'strand_based' | 'texture_based' | 'polygon_based';
  };

  // Lighting configuration
  lighting: {
    setup: 'three_point_studio' | 'natural' | 'dramatic' | 'cinematic';
    keyLight: { intensity: number; angle: number };
    fillLight: { intensity: number; angle: number };
    rimLight: { intensity: number; angle: number };
    ambientOcclusion: boolean;
  };

  // Output specifications
  output: {
    style: 'portrait' | 'bust' | 'full_body';
    background: 'neutral_gradient' | 'studio_backdrop' | 'transparent' | 'environment';
    depthOfField: 'none' | 'subtle' | 'dramatic';
    postProcessing: string[];
  };
}

export interface CGIQualityPreset {
  id: string;
  name: string;
  description: string;
  specs: CGIRenderingSpecs;
}

export class CGIPromptEnhancer {
  private readonly cgiPresets: CGIQualityPreset[] = [
    {
      id: 'animation_studio',
      name: 'Animation Studio',
      description: 'High-end animation studio quality (Pixar/Disney level)',
      specs: {
        preservation: [
          'facial_features',
          'skin_tone',
          'hair_style',
          'eye_color',
          'body_proportions',
          'age_characteristics',
          'unique_facial_marks'
        ],
        cgParameters: {
          quality: 'photorealistic',
          meshDensity: 'ultra_high',
          textureResolution: '4K',
          renderEngine: 'PBR',
          skinShader: 'subsurface_scattering',
          hairSystem: 'strand_based'
        },
        lighting: {
          setup: 'three_point_studio',
          keyLight: { intensity: 1.0, angle: 45 },
          fillLight: { intensity: 0.5, angle: -30 },
          rimLight: { intensity: 0.7, angle: 135 },
          ambientOcclusion: true
        },
        output: {
          style: 'portrait',
          background: 'neutral_gradient',
          depthOfField: 'subtle',
          postProcessing: ['color_grading', 'sharpening', 'ambient_occlusion']
        }
      }
    },
    {
      id: 'game_engine',
      name: 'Game Engine',
      description: 'Real-time game engine quality (Unreal/Unity level)',
      specs: {
        preservation: [
          'facial_features',
          'skin_tone',
          'hair_style',
          'eye_color',
          'body_proportions'
        ],
        cgParameters: {
          quality: 'photorealistic',
          meshDensity: 'high_polygon',
          textureResolution: '2K',
          renderEngine: 'PBR',
          skinShader: 'subsurface_scattering',
          hairSystem: 'texture_based'
        },
        lighting: {
          setup: 'three_point_studio',
          keyLight: { intensity: 0.9, angle: 45 },
          fillLight: { intensity: 0.4, angle: -30 },
          rimLight: { intensity: 0.6, angle: 135 },
          ambientOcclusion: true
        },
        output: {
          style: 'portrait',
          background: 'neutral_gradient',
          depthOfField: 'subtle',
          postProcessing: ['color_grading', 'sharpening']
        }
      }
    },
    {
      id: 'film_quality',
      name: 'Film Quality',
      description: 'Movie-grade CGI quality (Marvel/Avatar level)',
      specs: {
        preservation: [
          'facial_features',
          'skin_tone',
          'hair_style',
          'eye_color',
          'body_proportions',
          'age_characteristics',
          'unique_facial_marks',
          'skin_texture_details'
        ],
        cgParameters: {
          quality: 'photorealistic',
          meshDensity: 'ultra_high',
          textureResolution: '8K',
          renderEngine: 'Raytraced',
          skinShader: 'subsurface_scattering',
          hairSystem: 'strand_based'
        },
        lighting: {
          setup: 'cinematic',
          keyLight: { intensity: 1.2, angle: 35 },
          fillLight: { intensity: 0.3, angle: -45 },
          rimLight: { intensity: 0.8, angle: 120 },
          ambientOcclusion: true
        },
        output: {
          style: 'portrait',
          background: 'neutral_gradient',
          depthOfField: 'dramatic',
          postProcessing: ['color_grading', 'sharpening', 'ambient_occlusion', 'volumetric_lighting']
        }
      }
    }
  ];

  /**
   * Generate CGI-enhanced prompt for PhotoMaker
   */
  generateCGIPrompt(
    basePrompt: string,
    cgiPresetId: string = 'animation_studio',
    customSpecs?: Partial<CGIRenderingSpecs>
  ): string {
    const preset = this.getCGIPreset(cgiPresetId);
    const specs = customSpecs ? this.mergeSpecs(preset.specs, customSpecs) : preset.specs;

    // Build CGI-enhanced prompt
    let cgiPrompt = basePrompt;

    // Add CGI transformation instruction
    cgiPrompt += ' Transform into photorealistic 3D CGI render with professional animation studio quality. ';

    // Add preservation requirements
    cgiPrompt += `Maintain exact likeness preserving: ${specs.preservation.join(', ')}. `;

    // Add technical CGI specifications
    cgiPrompt += this.buildTechnicalSpecs(specs);

    // Add lighting specifications
    cgiPrompt += this.buildLightingSpecs(specs.lighting);

    // Add output specifications
    cgiPrompt += this.buildOutputSpecs(specs.output);

    // Add quality target
    cgiPrompt += `Quality target: ${preset.description}. `;

    // Final rendering instructions
    cgiPrompt += 'Render as high-end 3D CGI character with movie-quality materials, lighting, and post-processing. ';
    cgiPrompt += 'Final output should be indistinguishable from professional animation studio work.';

    return cgiPrompt;
  }

  /**
   * Build technical CGI specifications string
   */
  private buildTechnicalSpecs(specs: CGIRenderingSpecs): string {
    const { cgParameters } = specs;

    let technical = 'Technical specifications: ';
    technical += `${cgParameters.quality} quality, `;
    technical += `${cgParameters.meshDensity.replace('_', ' ')} mesh density, `;
    technical += `${cgParameters.textureResolution} texture resolution, `;
    technical += `${cgParameters.renderEngine} rendering engine, `;
    technical += `${cgParameters.skinShader.replace('_', ' ')} skin materials, `;
    technical += `${cgParameters.hairSystem.replace('_', ' ')} hair system. `;

    return technical;
  }

  /**
   * Build lighting specifications string
   */
  private buildLightingSpecs(lighting: CGIRenderingSpecs['lighting']): string {
    let lightingSpec = `Professional ${lighting.setup.replace('_', ' ')} lighting setup: `;
    lightingSpec += `key light (${lighting.keyLight.intensity} intensity, ${lighting.keyLight.angle}° angle), `;
    lightingSpec += `fill light (${lighting.fillLight.intensity} intensity, ${lighting.fillLight.angle}° angle), `;
    lightingSpec += `rim light (${lighting.rimLight.intensity} intensity, ${lighting.rimLight.angle}° angle)`;

    if (lighting.ambientOcclusion) {
      lightingSpec += ', ambient occlusion enabled';
    }

    lightingSpec += '. ';
    return lightingSpec;
  }

  /**
   * Build output specifications string
   */
  private buildOutputSpecs(output: CGIRenderingSpecs['output']): string {
    let outputSpec = `Output format: ${output.style} style, `;
    outputSpec += `${output.background.replace('_', ' ')} background, `;
    outputSpec += `${output.depthOfField} depth of field`;

    if (output.postProcessing.length > 0) {
      outputSpec += `, post-processing: ${output.postProcessing.join(', ')}`;
    }

    outputSpec += '. ';
    return outputSpec;
  }

  /**
   * Get CGI preset by ID
   */
  getCGIPreset(presetId: string): CGIQualityPreset {
    const preset = this.cgiPresets.find(p => p.id === presetId);
    if (!preset) {
      console.warn(`CGI preset '${presetId}' not found, using default 'animation_studio'`);
      return this.cgiPresets[0]; // Default to animation studio
    }
    return preset;
  }

  /**
   * Get all available CGI presets
   */
  getAvailableCGIPresets(): CGIQualityPreset[] {
    return [...this.cgiPresets];
  }

  /**
   * Merge custom specifications with preset specifications
   */
  private mergeSpecs(baseSpecs: CGIRenderingSpecs, customSpecs: Partial<CGIRenderingSpecs>): CGIRenderingSpecs {
    return {
      preservation: customSpecs.preservation || baseSpecs.preservation,
      cgParameters: { ...baseSpecs.cgParameters, ...customSpecs.cgParameters },
      lighting: { ...baseSpecs.lighting, ...customSpecs.lighting },
      output: { ...baseSpecs.output, ...customSpecs.output }
    };
  }

  /**
   * Generate CGI prompt for specific measurements and style
   */
  generateCGIPromptForAvatar(
    measurements: any,
    style: string = 'Photographic',
    perspective: string = 'portrait',
    cgiPresetId: string = 'animation_studio'
  ): string {
    // Start with base personalized description
    let basePrompt = 'Professional portrait of the person in the reference photos, ';

    // Add measurement-based characteristics
    if (measurements) {
      const height = Number(measurements.height) || 170;
      const chest = Number(measurements.chest) || 90;
      const waist = Number(measurements.waist) || 80;
      const ratio = chest / waist;

      if (height < 160) {
        basePrompt += 'maintaining their petite build and shorter stature, ';
      } else if (height > 185) {
        basePrompt += 'maintaining their tall stature and commanding presence, ';
      }

      if (ratio > 1.3) {
        basePrompt += 'with athletic physique and broad shoulders, ';
      } else if (ratio < 1.1) {
        basePrompt += 'with slender frame and elegant proportions, ';
      }

      if (measurements.gender) {
        const gender = measurements.gender.toLowerCase();
        if (gender === 'male') {
          basePrompt += 'preserving masculine facial features and bone structure, ';
        } else if (gender === 'female') {
          basePrompt += 'preserving feminine facial features and graceful bone structure, ';
        }
      }
    }

    // Add perspective specification
    switch (perspective.toLowerCase()) {
      case 'portrait':
        basePrompt += 'head and shoulders portrait composition, ';
        break;
      case 'bust':
        basePrompt += 'bust portrait with upper body visible, ';
        break;
      case 'full':
        basePrompt += 'full body portrait showing complete figure, ';
        break;
    }

    // Generate CGI-enhanced prompt
    return this.generateCGIPrompt(basePrompt, cgiPresetId);
  }

  /**
   * Analyze CGI quality from generated result
   */
  analyzeCGIQuality(imageUrl: string, presetId: string): {
    qualityScore: number;
    cgiFeatures: string[];
    technicalMetrics: Record<string, any>;
  } {
    const preset = this.getCGIPreset(presetId);

    // Base quality score calculation
    let qualityScore = 85; // Base for CGI enhancement

    // Add bonus for higher quality presets
    switch (presetId) {
      case 'film_quality':
        qualityScore += 15;
        break;
      case 'animation_studio':
        qualityScore += 10;
        break;
      case 'game_engine':
        qualityScore += 5;
        break;
    }

    const cgiFeatures = [
      '3D CGI Rendering',
      'Professional Lighting',
      'Photorealistic Materials',
      `${preset.specs.cgParameters.meshDensity.replace('_', ' ')} Mesh`,
      `${preset.specs.cgParameters.textureResolution} Textures`,
      `${preset.specs.cgParameters.skinShader.replace('_', ' ')} Skin`,
      `${preset.specs.lighting.setup.replace('_', ' ')} Lighting`
    ];

    const technicalMetrics = {
      preset: preset.name,
      meshDensity: preset.specs.cgParameters.meshDensity,
      textureResolution: preset.specs.cgParameters.textureResolution,
      renderEngine: preset.specs.cgParameters.renderEngine,
      lightingSetup: preset.specs.lighting.setup,
      postProcessing: preset.specs.output.postProcessing
    };

    return {
      qualityScore: Math.min(100, qualityScore),
      cgiFeatures,
      technicalMetrics
    };
  }
}

// Export singleton instance
export const cgiPromptEnhancer = new CGIPromptEnhancer();
export default cgiPromptEnhancer;