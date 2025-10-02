import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Edit3, Palette, RotateCcw, User, Sparkles } from 'lucide-react';

// Confetti Component
const ConfettiPiece: React.FC<{ delay: number; color: string; left: string }> = ({ delay, color, left }) => (
  <div
    className={`absolute w-3 h-3 ${color} animate-confetti-fall`}
    style={{
      left,
      animationDelay: `${delay}s`,
      top: '-10px'
    }}
  />
);

const Confetti: React.FC = () => {
  const colors = ['bg-purple-400', 'bg-pink-400', 'bg-cyan-400', 'bg-yellow-400', 'bg-green-400', 'bg-red-400'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: `${Math.random() * 100}%`
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          left={piece.left}
        />
      ))}
    </div>
  );
};

interface AvatarPreviewProps {
  onNext: () => void;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ onNext }) => {
  const [isRotating, setIsRotating] = useState(false);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const [selectedCustomization, setSelectedCustomization] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  // Hide confetti after 4 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const customizationOptions = [
    { id: 'skin', label: 'Skin Tone', icon: <img src="/page-4-icons/skin-tone.PNG" alt="Skin tone" className="w-10 h-10" />, options: ['#F3D5AB', '#E8B894', '#D4A574', '#C19A6B', '#8B4513'] },
    { id: 'hair', label: 'Hair Color', icon: <img src="/page-4-icons/hair-color.PNG" alt="Hair color" className="w-10 h-10" />, options: ['#2C1B18', '#5C4033', '#8B4513', '#CD853F', '#F4A460'] },
    { id: 'outfit', label: 'Base Outfit', icon: <img src="/page-4-icons/base-outfit.PNG" alt="Base outfit" className="w-10 h-10" />, options: ['casual', 'formal', 'sporty', 'trendy'] }
  ];

  const handleRotate = () => {
    setIsRotating(true);
    setAvatarRotation(prev => prev + 90);
    setTimeout(() => setIsRotating(false), 600);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="relative flex items-center justify-center">
          <img
            src="/my-animated-avatar/your-avatar.GIF" 
            alt="Your Animated Avatar Headline"
            className="w-80 h-80 mx-auto animate-avatar-shake rounded-full halo-glow"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Success Message */}
      <div className="mb-8 flex">
        <img
          src="/success-banner/success.GIF"
          alt="Avatar Created Successfully"
          className="w-full max-w-md h-auto rounded-2xl hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Avatar Display */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <div className="relative">
          {/* 3D Avatar Placeholder */}
          <div 
            className={`w-64 h-80 bg-gradient-to-b from-gray-100 to-gray-200 rounded-3xl shadow-2xl flex items-center justify-center transition-transform duration-600 ${
              isRotating ? 'animate-pulse' : ''
            }`}
            style={{ transform: `rotateY(${avatarRotation}deg)` }}
          >
            <img
              src="/portrait/my-new-portrait.png"
              alt="Your 3D Avatar"
             className="bg-transparent hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Rotate Button */}
          <button
            onClick={handleRotate}
            disabled={isRotating}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            <RotateCcw className={`w-5 h-5 text-gray-700 ${isRotating ? 'animate-spin' : ''}`} />
          </button>

        </div>
      </div>

      {/* Customization Options */}
      <div className="mb-8">
        <img
          src="/painted-animation/ac.png"
          alt="Customize Your Avatar"
          className="w-full max-w-xs h-auto mx-auto mb-1 mt-12 hover:scale-105 transition-transform duration-300"
        />
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          {customizationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedCustomization(option.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedCustomization === option.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              } hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center justify-center mb-2 h-8">{option.icon}</div>
              <p className="text-sm font-medium text-gray-700">{option.label}</p>
            </button>
          ))}
        </div>

        {/* Color Options */}
        {selectedCustomization && (
          <div className="animate-fadeIn bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3">
              Choose {customizationOptions.find(opt => opt.id === selectedCustomization)?.label}
            </h4>
            <div className="flex space-x-3">
              {customizationOptions
                .find(opt => opt.id === selectedCustomization)
                ?.options.map((option, index) => (
                  <button
                    key={index}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
                    style={{ 
                      backgroundColor: typeof option === 'string' && option.startsWith('#') ? option : undefined 
                    }}
                  >
                    {typeof option === 'string' && !option.startsWith('#') && (
                      <span className="text-xs">{option}</span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-0">
        <button
          onClick={onNext}
          className="max-w-md ml-0 bg-transparent text-purple-600 font-semibold p-0 m-0 rounded-2xl hover:scale-105 transition-all duration-300"
        >
          <img
            src="/set-up/completed.PNG"
            alt="Complete Profile Setup button"
            className="w-full object-contain rounded-2xl block"
          />
        </button>

        <button className="max-w-md ml-0 bg-transparent text-purple-600 font-semibold p-0 mt-[-8] rounded-2xl hover:scale-105 transition-all duration-300">
          <img
            src="/edit-measurements/bow.png"
            alt="Edit Measurements button"
            className="w-full object-contain rounded-2xl block"
          />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2 mt-6">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-6 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </div>
      {showConfetti && <Confetti />}
    </div>
  );
};

export default AvatarPreview;