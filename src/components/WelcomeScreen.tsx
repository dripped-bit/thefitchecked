import React, { useState, useEffect } from 'react';
import { Camera, Zap, Trash, Sparkles, User, Users } from 'lucide-react';
import avatarManagementService, { type SavedAvatar } from '../services/avatarManagementService';
import { useHaptics } from '../utils/haptics';

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
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-300 rotate-45 opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-amber-300 rotate-12 opacity-20"></div>
      </div>

      {/* Logo */}
      <div className="mb-8 z-10">
        <div className="relative">
          <img
            src="/Untitled design.PNG"
            alt="TheFitChecked Logo"
            className="w-80 md:w-96 h-auto mx-auto drop-shadow-2xl bg-transparent animate-keyboard-bounce hover:scale-105 transition-transform duration-300"
            style={{
              filter: 'contrast(1.2) brightness(1.1)',
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

      {/* Elegant Cursive Tagline */}
      <p className="font-dancing-script text-4xl md:text-5xl mb-12 leading-relaxed max-w-md text-center text-stone-800">
        Shop Smarter, Return Never
      </p>

      {/* Feature Blocks with Custom Image Icons */}
      <div className="space-y-4 mb-12 z-10 max-w-xs mx-auto text-left">
        {/* 3D Avatar Feature */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <Camera className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">3D Avatar from Photos</h3>
            <p className="text-gray-600 text-xs">Professional-grade avatar creation</p>
          </div>
        </div>

        {/* Virtual Try-On Feature */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <Zap className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Virtual Try-On Magic</h3>
            <p className="text-gray-600 text-xs">AI-powered fitting technology</p>
          </div>
        </div>

        {/* Digital Closet Feature */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Digital Closet & Styling</h3>
            <p className="text-gray-600 text-xs">Curated wardrobe management</p>
          </div>
        </div>
      </div>
      {/* Saved Avatar Option - Show if avatars exist */}
      {hasSavedAvatars && (
        <div className="w-full max-w-sm mx-auto mb-6">
          <div className="bg-white/5 backdrop-blur-lg border border-green-500/20 rounded-2xl p-4">
            <div className="text-center">
              <User className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-2">Welcome Back!</h3>
              <p className="text-gray-300 text-sm mb-4">
                {savedAvatars.length} saved avatar{savedAvatars.length !== 1 ? 's' : ''} available
              </p>

              {/* Show default avatar or first avatar */}
              {savedAvatars.length > 0 && (
                <button
                  onClick={() => handleLoadAvatar(savedAvatars.find(a => a.isDefault)?.id || savedAvatars[0].id)}
                  className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl p-3 text-green-300 hover:text-green-200 transition-all duration-200 mb-3"
                >
                  {savedAvatars.find(a => a.isDefault) ?
                    `Use ${savedAvatars.find(a => a.isDefault)!.name}` :
                    `Use ${savedAvatars[0].name}`
                  }
                </button>
              )}

              {savedAvatars.length > 1 && (
                <button
                  onClick={() => {
                    haptics.light();
                    setShowAvatarSelector(true);
                  }}
                  className="w-full text-green-400 hover:text-green-300 text-sm transition-colors"
                >
                  Choose from {savedAvatars.length} avatars
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Choose Your Avatar</h3>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {savedAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    handleLoadAvatar(avatar.id);
                    setShowAvatarSelector(false);
                  }}
                  className="w-full flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="text-white font-medium">{avatar.name}</h4>
                    <p className="text-gray-400 text-sm">
                      Created {new Date(avatar.createdAt).toLocaleDateString()}
                      {avatar.isDefault && (
                        <span className="ml-2 text-green-400 text-xs">• Default</span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                haptics.medium();
                setShowAvatarSelector(false);
                onNext();
              }}
              className="w-full mt-4 p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-xl text-amber-300 hover:text-amber-200 transition-all duration-200"
            >
              + Create New Avatar Instead
            </button>
          </div>
        </div>
      )}

      {/* Premium CTA Button */}
      <button
        onClick={() => {
          haptics.medium(); // Medium impact for primary CTA
          onNext();
        }}
        className="relative w-full max-w-sm mx-auto group transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-slate-200/50"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg group-hover:shadow-xl group-hover:shadow-slate-500/15 transition-all duration-300">
          {/* Translucent Ripple Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-6 w-16 h-16 rounded-full border border-white/30 animate-ping"></div>
            <div className="absolute bottom-6 right-8 w-12 h-12 rounded-full border border-white/20 animate-pulse"></div>
            <div className="absolute top-8 right-12 w-8 h-8 rounded-full border border-white/25 animate-bounce"></div>
            <div className="absolute bottom-4 left-12 w-20 h-20 rounded-full border border-white/15 animate-ping" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/10 animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="relative bg-white/2 backdrop-blur-md rounded-xl px-8 py-4 group-hover:bg-white/5 transition-all duration-300">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white/8 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/15 transition-all duration-300">
                <Sparkles className="w-5 h-5 text-slate-600 group-hover:text-slate-700" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black transition-all duration-300">
                  {hasSavedAvatars ? 'Create New Avatar' : 'Create Your Avatar'}
                </div>
                <div className="text-sm text-gray-500 group-hover:text-slate-600 transition-all duration-300">
                  {hasSavedAvatars ? 'Take new photos' : 'Start your journey'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Skip Option */}
      <button className="mt-8 text-gray-500 text-sm hover:text-amber-600 hover:scale-105 transition-all duration-300 font-medium tracking-wide">
        I'll explore later
      </button>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute top-40 right-8 w-2 h-2 bg-stone-300 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-32 left-6 w-4 h-4 bg-cyan-300 rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-20 right-12 w-3 h-3 bg-yellow-300 rounded-full animate-bounce opacity-60"></div>
    </div>
  );
};

export default WelcomeScreen;