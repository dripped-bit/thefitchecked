import React, { useState, useEffect } from 'react';
import { Camera, Zap, Trash, Sparkles, User, Users } from 'lucide-react';
import avatarManagementService, { type SavedAvatar } from '../services/avatarManagementService';
import { useHaptics } from '../utils/haptics';
import IOSButton from './ui/IOSButton';

interface WelcomeScreenProps {
  onNext: () => void;
  onLoadSavedAvatar?: (avatarId: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onLoadSavedAvatar }) => {
  const [savedAvatars, setSavedAvatars] = useState<SavedAvatar[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Haptic feedback hook
  const haptics = useHaptics();

  useEffect(() => {
    // Load saved avatars on component mount
    const avatars = avatarManagementService.getSavedAvatars();
    setSavedAvatars(avatars);
    console.log('🎭 [WELCOME] Found saved avatars:', avatars.length);
  }, []);

  const handleLoadAvatar = (avatarId: string) => {
    haptics.light(); // Light tap for secondary action
    if (onLoadSavedAvatar) {
      onLoadSavedAvatar(avatarId);
    }
  };

  const hasSavedAvatars = savedAvatars.length > 0;

  return (
    <div className="min-h-screen flex flex-col justify-start items-center px-6 pt-12 pb-6 text-center relative overflow-hidden bg-white">
      {/* Background image with 40% opacity */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ 
          backgroundImage: 'url(/my-background.jpg/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* All content layered above background */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Logo - Apple Design */}
        <div className="mb-4 ios-fade-in">
        <div className="relative">
          <img
            src="/Untitled design.PNG"
            alt="TheFitChecked Logo"
            className="w-80 md:w-96 h-auto mx-auto bg-transparent animate-keyboard-bounce hover:scale-105 transition-transform duration-300"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15)) contrast(1.2) brightness(1.1)',
              mixBlendMode: 'multiply'
            }}
          />
          
          {/* Luminous Green Checkmark - Idea Light Bulb */}
          <div className="absolute top-8 right-8 md:right-12">
            <img
              src="/Untitled design 2.png.PNG"
              alt="Idea Checkmark"
              className="w-12 h-12 md:w-16 md:h-16 animate-lightbulb-flicker"
              style={{
                filter: 'contrast(1.3) brightness(1.2)',
                mixBlendMode: 'screen'
              }}
            />
          </div>
          </div>
        </div>

        {/* Elegant Cursive Tagline - Apple Typography */}
        <p className="font-dancing-script ios-large-title mb-6 leading-relaxed max-w-md text-center ios-fade-in" style={{ animationDelay: '0.2s' }}>
          Shop Smarter, Return Never
        </p>

        {/* Feature Blocks - Clean Design without white boxes */}
        <div className="space-y-3 mb-6 max-w-xs mx-auto">
        {[
          { icon: Camera, title: '3D Avatar from Photos', desc: 'Professional-grade avatar creation' },
          { icon: Zap, title: 'Virtual Try-On Magic', desc: 'AI-powered fitting technology' },
          { icon: Sparkles, title: 'Digital Closet & Styling', desc: 'Curated wardrobe management' }
        ].map((feature, idx) => (
          <div key={idx} className="p-4 ios-scale-in" style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-ios-md bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-ios-blue" />
              </div>
              <div>
                <h3 className="ios-headline">{feature.title}</h3>
                <p className="ios-caption-1 text-ios-label-secondary">{feature.desc}</p>
              </div>
            </div>
          </div>
        ))}
        </div>
        
        {/* Saved Avatar Option - Apple Design */}
        {hasSavedAvatars && (
          <div className="w-full max-w-sm mx-auto mb-6 ios-slide-up">
          <div className="ios-card ios-blur bg-ios-bg-secondary/95 border border-ios-green/20 p-4">
            <div className="text-center">
              <User className="w-8 h-8 text-ios-green mx-auto mb-2" />
              <h3 className="ios-title-3 mb-2">Welcome Back!</h3>
              <p className="ios-callout text-ios-label-secondary mb-4">
                {savedAvatars.length} saved avatar{savedAvatars.length !== 1 ? 's' : ''} available
              </p>

              {/* Show default avatar or first avatar */}
              {savedAvatars.length > 0 && (
                <IOSButton
                  onClick={() => handleLoadAvatar(savedAvatars.find(a => a.isDefault)?.id || savedAvatars[0].id)}
                  variant="filled"
                  fullWidth
                  className="mb-3"
                >
                  {savedAvatars.find(a => a.isDefault) ?
                    `Use ${savedAvatars.find(a => a.isDefault)!.name}` :
                    `Use ${savedAvatars[0].name}`
                  }
                </IOSButton>
              )}

              {savedAvatars.length > 1 && (
                <button
                  onClick={() => {
                    haptics.light();
                    setShowAvatarSelector(true);
                  }}
                  className="w-full ios-callout text-ios-green hover:text-ios-blue transition-colors"
                >
                  Choose from {savedAvatars.length} avatars
                </button>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Avatar Selector Modal - Apple Design */}
        {showAvatarSelector && (
        <div className="fixed inset-0 bg-black/50 ios-blur flex items-center justify-center p-4 z-50">
          <div className="ios-card ios-blur bg-ios-bg-secondary/95 p-6 max-w-md w-full max-h-80 overflow-y-auto ios-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="ios-title-2">Choose Your Avatar</h3>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="text-ios-label-secondary hover:text-ios-label transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="ios-list rounded-ios-lg overflow-hidden">
              {savedAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    handleLoadAvatar(avatar.id);
                    setShowAvatarSelector(false);
                  }}
                  className="ios-list-item w-full"
                >
                  <div className="flex items-center w-full">
                    <div className="w-12 h-12 bg-gradient-to-r from-ios-blue to-ios-purple rounded-ios-md flex items-center justify-center mr-3">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="ios-body">{avatar.name}</h4>
                      <p className="ios-caption-1 text-ios-label-secondary">
                        Created {new Date(avatar.createdAt).toLocaleDateString()}
                        {avatar.isDefault && (
                          <span className="ml-2 text-ios-green">• Default</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <IOSButton
              onClick={() => {
                haptics.medium();
                setShowAvatarSelector(false);
                onNext();
              }}
              variant="tinted"
              fullWidth
              className="mt-4"
            >
              + Create New Avatar Instead
            </IOSButton>
          </div>
        </div>
        )}

        {/* Premium CTA Button */}
        <IOSButton
        onClick={() => {
          console.log('🔘 [WELCOME] Create Avatar button clicked - navigating to photo capture');
          haptics.medium(); // Medium impact for primary CTA
          onNext();
        }}
        variant="filled"
        size="large"
        fullWidth
        className="max-w-sm mx-auto z-20 relative"
      >
        <div className="flex items-center justify-center space-x-3">
          <Sparkles className="w-5 h-5" />
          <div className="text-center">
            <div className="text-lg font-bold">
              {hasSavedAvatars ? 'Create New Avatar' : 'Create Your Avatar'}
            </div>
            <div className="text-sm opacity-80">
              {hasSavedAvatars ? 'Take new photos' : 'Start your journey'}
            </div>
          </div>
        </div>
        </IOSButton>

        {/* Skip Option - Apple Style */}
        <button className="mt-4 ios-callout text-ios-label-tertiary hover:text-ios-blue transition-colors">
          I'll explore later
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute top-40 right-8 w-2 h-2 bg-stone-300 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-32 left-6 w-4 h-4 bg-cyan-300 rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-20 right-12 w-3 h-3 bg-yellow-300 rounded-full animate-bounce opacity-60"></div>
    </div>
  );
};

export default WelcomeScreen;