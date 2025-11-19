/**
 * Avatar Animation Service - Handles subtle avatar animations and movements
 * Uses CSS animations and potential fal.ai video generation for more advanced animations
 */

export type AnimationType = 'breathing' | 'floatingBreath' | 'gentleSway' | 'idle' | 'spin' | 'bounce' | 'wave' | 'nod' | 'wink' | 'armSway' | 'footTap' | 'waitingSequence' | 'changing' | 'posing';

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // in milliseconds
  intensity: 'subtle' | 'normal' | 'strong';
  loop: boolean;
}

export interface AnimationSequence {
  animations: AnimationConfig[];
  totalDuration: number;
}

class AvatarAnimationService {
  private currentAnimation: AnimationType = 'breathing';
  private animationQueue: AnimationConfig[] = [];
  private isAnimating = false;

  /**
   * Get CSS animation classes for different animation types
   */
  getAnimationClass(type: AnimationType, intensity: 'subtle' | 'normal' | 'strong' = 'normal'): string {
    const intensityMap = {
      subtle: 'subtle',
      normal: '',
      strong: 'strong'
    };

    const suffix = intensityMap[intensity];

    switch (type) {
      case 'breathing':
        return `animate-breathing ${suffix ? `breathing-${suffix}` : ''}`.trim();
      case 'floatingBreath':
        return `animate-floating-breath ${suffix ? `floating-breath-${suffix}` : ''}`.trim();
      case 'gentleSway':
        return `animate-gentle-sway ${suffix ? `gentle-sway-${suffix}` : ''}`.trim();
      case 'idle':
        return `animate-sway ${suffix ? `sway-${suffix}` : ''}`.trim();
      case 'spin':
        return `animate-spin ${suffix ? `spin-${suffix}` : ''}`.trim();
      case 'bounce':
        return `animate-bounce ${suffix ? `bounce-${suffix}` : ''}`.trim();
      case 'wave':
        return `animate-wave ${suffix ? `wave-${suffix}` : ''}`.trim();
      case 'nod':
        return `animate-nod ${suffix ? `nod-${suffix}` : ''}`.trim();
      case 'wink':
        return `animate-wink ${suffix ? `wink-${suffix}` : ''}`.trim();
      case 'armSway':
        return `animate-arm-sway ${suffix ? `arm-sway-${suffix}` : ''}`.trim();
      case 'footTap':
        return `animate-foot-tap ${suffix ? `foot-tap-${suffix}` : ''}`.trim();
      case 'waitingSequence':
        return `animate-waiting-sequence ${suffix ? `waiting-${suffix}` : ''}`.trim();
      case 'changing':
        return `animate-pulse ${suffix ? `pulse-${suffix}` : ''}`.trim();
      case 'posing':
        return `animate-bounce ${suffix ? `bounce-${suffix}` : ''}`.trim();
      default:
        return 'animate-pulse';
    }
  }

  /**
   * Get CSS keyframes for custom animations
   */
  getAnimationKeyframes(): string {
    return `
      @keyframes avatarSway {
        0%, 100% { transform: translateX(0) rotateY(0deg); }
        25% { transform: translateX(-2px) rotateY(-1deg); }
        75% { transform: translateX(2px) rotateY(1deg); }
      }

      @keyframes avatarBreathing {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.02); }
      }

      @keyframes avatarBlink {
        0%, 90%, 100% { opacity: 1; }
        95% { opacity: 0.3; }
      }

      @keyframes avatarWave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        75% { transform: rotate(-15deg); }
      }

      @keyframes avatarNod {
        0%, 100% { transform: rotateX(0deg); }
        50% { transform: rotateX(10deg); }
      }

      @keyframes avatarWink {
        0%, 85%, 100% {
          filter: brightness(1);
          transform: scaleY(1);
        }
        90%, 95% {
          filter: brightness(0.8);
          transform: scaleY(0.95);
        }
      }

      @keyframes avatarArmSway {
        0%, 100% { transform: rotate(0deg) translateX(0); }
        25% { transform: rotate(2deg) translateX(-3px); }
        75% { transform: rotate(-2deg) translateX(3px); }
      }

      @keyframes avatarFootTap {
        0%, 70%, 100% { transform: translateY(0) rotateZ(0deg); }
        15%, 35% { transform: translateY(-2px) rotateZ(1deg); }
        50% { transform: translateY(-1px) rotateZ(-0.5deg); }
      }

      @keyframes avatarWaitingSequence {
        0%, 100% {
          transform: translateY(0) rotate(0deg);
          filter: brightness(1);
        }
        10% {
          filter: brightness(0.9);
          transform: scaleY(0.98);
        }
        25% {
          transform: translateY(-1px) rotate(1deg);
        }
        50% {
          transform: translateY(-2px) rotate(-1deg);
        }
        75% {
          transform: translateY(-1px) rotate(0.5deg);
        }
        85% {
          filter: brightness(0.85);
          transform: scaleY(0.96);
        }
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
        50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.6); }
      }

      /* Animation classes */
      .animate-sway {
        animation: avatarSway 4s ease-in-out infinite;
      }

      .animate-sway-subtle {
        animation: avatarSway 6s ease-in-out infinite;
      }

      .animate-sway-strong {
        animation: avatarSway 2s ease-in-out infinite;
      }

      .animate-breathing {
        animation: avatarBreathing 3s ease-in-out infinite;
      }

      .animate-breathing-subtle {
        animation: avatarBreathing 5s ease-in-out infinite;
      }

      .animate-breathing-strong {
        animation: avatarBreathing 2s ease-in-out infinite;
      }

      .animate-blink {
        animation: avatarBlink 4s ease-in-out infinite;
      }

      .animate-blink-subtle {
        animation: avatarBlink 6s ease-in-out infinite;
      }

      .animate-blink-strong {
        animation: avatarBlink 2s ease-in-out infinite;
      }

      .animate-wave {
        animation: avatarWave 2s ease-in-out;
      }

      .animate-nod {
        animation: avatarNod 1s ease-in-out;
      }

      .animate-wink {
        animation: avatarWink 3s ease-in-out infinite;
      }

      .animate-wink-subtle {
        animation: avatarWink 5s ease-in-out infinite;
      }

      .animate-wink-strong {
        animation: avatarWink 2s ease-in-out infinite;
      }

      .animate-arm-sway {
        animation: avatarArmSway 4s ease-in-out infinite;
      }

      .animate-arm-sway-subtle {
        animation: avatarArmSway 6s ease-in-out infinite;
      }

      .animate-arm-sway-strong {
        animation: avatarArmSway 3s ease-in-out infinite;
      }

      .animate-foot-tap {
        animation: avatarFootTap 2s ease-in-out infinite;
      }

      .animate-foot-tap-subtle {
        animation: avatarFootTap 3s ease-in-out infinite;
      }

      .animate-foot-tap-strong {
        animation: avatarFootTap 1.5s ease-in-out infinite;
      }

      .animate-waiting-sequence {
        animation: avatarWaitingSequence 8s ease-in-out infinite;
      }

      .animate-waiting-sequence-subtle {
        animation: avatarWaitingSequence 10s ease-in-out infinite;
      }

      .animate-waiting-sequence-strong {
        animation: avatarWaitingSequence 6s ease-in-out infinite;
      }

      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      .animate-glow {
        animation: glow 2s ease-in-out infinite;
      }

      .shimmer-effect {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        background-size: 200% 100%;
        animation: shimmer 2s ease-in-out infinite;
      }

      /* Pulse intensity variations */
      .pulse-subtle {
        animation-duration: 4s;
      }

      .pulse-strong {
        animation-duration: 1s;
      }

      /* Spin variations */
      .spin-subtle {
        animation-duration: 3s;
      }

      .spin-strong {
        animation-duration: 0.5s;
      }

      /* Bounce variations */
      .bounce-subtle {
        animation-duration: 2s;
      }

      .bounce-strong {
        animation-duration: 0.5s;
      }
    `;
  }

  /**
   * Create an animation sequence based on user interaction or events
   */
  createAnimationSequence(trigger: 'greeting' | 'outfit_change' | 'idle' | 'interaction'): AnimationSequence {
    switch (trigger) {
      case 'greeting':
        return {
          animations: [
            { type: 'wave', duration: 2000, intensity: 'normal', loop: false },
            { type: 'breathing', duration: 5000, intensity: 'subtle', loop: true }
          ],
          totalDuration: 7000
        };

      case 'outfit_change':
        return {
          animations: [
            { type: 'spin', duration: 1000, intensity: 'normal', loop: false },
            { type: 'bounce', duration: 1000, intensity: 'subtle', loop: false },
            { type: 'breathing', duration: 3000, intensity: 'normal', loop: true }
          ],
          totalDuration: 5000
        };

      case 'interaction':
        return {
          animations: [
            { type: 'nod', duration: 1000, intensity: 'normal', loop: false },
            { type: 'breathing', duration: 4000, intensity: 'subtle', loop: true }
          ],
          totalDuration: 5000
        };

      case 'idle':
      default:
        return {
          animations: [
            { type: 'floatingBreath', duration: 4000, intensity: 'subtle', loop: true },
            { type: 'gentleSway', duration: 6000, intensity: 'subtle', loop: true },
            { type: 'idle', duration: 8000, intensity: 'subtle', loop: true }
          ],
          totalDuration: 0 // Infinite
        };
    }
  }

  /**
   * Get random idle animation to keep avatar lively
   */
  getRandomIdleAnimation(): AnimationType {
    const idleAnimations: AnimationType[] = ['breathing', 'floatingBreath', 'gentleSway', 'idle'];
    return idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
  }

  /**
   * Create a lively waiting sequence with wink, arm sway, and foot tap
   */
  createWaitingSequence(): AnimationSequence {
    return {
      animations: [
        { type: 'waitingSequence', duration: 8000, intensity: 'subtle', loop: true },
        { type: 'wink', duration: 5000, intensity: 'subtle', loop: true },
        { type: 'armSway', duration: 6000, intensity: 'subtle', loop: true },
        { type: 'footTap', duration: 3000, intensity: 'subtle', loop: true }
      ],
      totalDuration: 0 // Infinite loop
    };
  }

  /**
   * Get a random waiting animation to add variety
   */
  getRandomWaitingAnimation(): AnimationType {
    const waitingAnimations: AnimationType[] = ['wink', 'armSway', 'footTap', 'waitingSequence'];
    return waitingAnimations[Math.floor(Math.random() * waitingAnimations.length)];
  }

  /**
   * Generate avatar interaction animations based on weather
   */
  getWeatherBasedAnimation(weatherCondition: string): AnimationType {
    switch (weatherCondition) {
      case 'sunny':
        return 'wave'; // Cheerful gesture
      case 'rainy':
        return 'idle'; // Calm movement
      case 'snowy':
        return 'breathing'; // Cozy feeling
      case 'cloudy':
        return 'nod'; // Thoughtful gesture
      default:
        return 'breathing';
    }
  }

  /**
   * Get mood-based animation intensity
   */
  getMoodBasedIntensity(mood: 'energetic' | 'calm' | 'focused' | 'playful'): 'subtle' | 'normal' | 'strong' {
    switch (mood) {
      case 'energetic':
        return 'strong';
      case 'playful':
        return 'normal';
      case 'focused':
        return 'subtle';
      case 'calm':
      default:
        return 'subtle';
    }
  }

  /**
   * Create outfit transition animation
   */
  createOutfitTransition(): {
    preTransition: string;
    transition: string;
    postTransition: string;
  } {
    return {
      preTransition: 'animate-glow',
      transition: 'shimmer-effect animate-spin',
      postTransition: 'animate-bounce'
    };
  }

  /**
   * Get animation for avatar loading states
   */
  getLoadingAnimation(type: 'generating' | 'processing' | 'uploading'): string {
    switch (type) {
      case 'generating':
        return 'shimmer-effect animate-pulse';
      case 'processing':
        return 'animate-spin';
      case 'uploading':
        return 'animate-bounce';
      default:
        return 'animate-pulse';
    }
  }

  /**
   * Apply animation to avatar element
   */
  applyAnimation(
    element: HTMLElement,
    animation: AnimationType,
    intensity: 'subtle' | 'normal' | 'strong' = 'normal',
    duration?: number
  ): void {
    if (!element) return;

    // Remove existing animation classes
    this.clearAnimations(element);

    // Add new animation class
    const animationClass = this.getAnimationClass(animation, intensity);
    element.className += ` ${animationClass}`;

    // Set custom duration if provided
    if (duration) {
      element.style.animationDuration = `${duration}ms`;
    }

    this.currentAnimation = animation;
  }

  /**
   * Clear all animations from element
   */
  clearAnimations(element: HTMLElement): void {
    if (!element) return;

    const animationClasses = [
      'animate-pulse', 'animate-spin', 'animate-bounce', 'animate-sway',
      'animate-breathing', 'animate-blink', 'animate-wave', 'animate-nod',
      'animate-wink', 'animate-arm-sway', 'animate-foot-tap', 'animate-waiting-sequence',
      'animate-float', 'animate-glow', 'shimmer-effect',
      'pulse-subtle', 'pulse-strong', 'spin-subtle', 'spin-strong',
      'bounce-subtle', 'bounce-strong', 'sway-subtle', 'sway-strong',
      'wink-subtle', 'wink-strong', 'arm-sway-subtle', 'arm-sway-strong',
      'foot-tap-subtle', 'foot-tap-strong', 'waiting-subtle', 'waiting-strong'
    ];

    animationClasses.forEach(className => {
      element.classList.remove(className);
    });

    // Reset custom animation duration
    element.style.animationDuration = '';
  }

  /**
   * Queue multiple animations in sequence
   */
  queueAnimations(animations: AnimationConfig[]): void {
    this.animationQueue = [...animations];
  }

  /**
   * Process animation queue
   */
  async processAnimationQueue(element: HTMLElement): Promise<void> {
    if (this.isAnimating || this.animationQueue.length === 0) return;

    this.isAnimating = true;

    for (const animation of this.animationQueue) {
      this.applyAnimation(element, animation.type, animation.intensity, animation.duration);

      if (!animation.loop) {
        await new Promise(resolve => setTimeout(resolve, animation.duration));
      }
    }

    this.animationQueue = [];
    this.isAnimating = false;
  }

  /**
   * Get current animation state
   */
  getCurrentAnimation(): AnimationType {
    return this.currentAnimation;
  }

  /**
   * Check if avatar is currently animating
   */
  isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }
}

export const avatarAnimationService = new AvatarAnimationService();