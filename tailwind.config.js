/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/konsta/react/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        'dancing-script': ['"Dancing Script"', 'cursive'],
      },
      colors: {
        'gen-z': {
          pink: '#FF6B9D',
          purple: '#A855F7',
          cyan: '#06D6A0',
          yellow: '#FFD93D',
          orange: '#FF8C42'
        },
        // iOS Design System Colors
        'ios-blue': '#007AFF',
        'ios-green': '#34C759',
        'ios-indigo': '#5856D6',
        'ios-orange': '#FF9500',
        'ios-pink': '#FF2D55',
        'ios-purple': '#AF52DE',
        'ios-red': '#FF3B30',
        'ios-teal': '#5AC8FA',
        'ios-yellow': '#FFCC00',
        'ios-gray': '#8E8E93',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounce 2s infinite',
        'keyboard-bounce': 'keyboardBounce 3s ease-in-out infinite',
        'lightbulb-flicker': 'lightbulbFlicker 4s ease-in-out infinite',
        'holographic-wave': 'holographicWave 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'shimmer-fast': 'shimmerFast 2s ease-in-out infinite',
        'dot-1': 'dotFade 1.5s ease-in-out infinite',
        'dot-2': 'dotFade 1.5s ease-in-out infinite 0.5s',
        'dot-3': 'dotFade 1.5s ease-in-out infinite 1s',
        'fur-flutter': 'furFlutter 4s ease-in-out infinite',
        'fur-wave-1': 'furWave1 3.5s ease-in-out infinite',
        'fur-wave-2': 'furWave2 4.2s ease-in-out infinite',
        'fur-shimmer': 'furShimmer 2.8s ease-in-out infinite',
        'slideInFromTop': 'slideInFromTop 0.8s ease-out',
        'fadeUpFromBottom': 'fadeUpFromBottom 0.6s ease-out forwards',
        'confetti-fall': 'confettiFall 3s ease-out infinite',
        'confetti-spin': 'confettiSpin 2s linear infinite',
        'checkmark-draw': 'checkmarkDraw 0.8s ease-out forwards',
        'metallic-shimmer': 'metallicShimmer 2s ease-in-out infinite',
        'golden-sparkle': 'goldenSparkle 2.5s ease-in-out infinite',
        'golden-pulse': 'goldenPulse 3s ease-in-out infinite',
        'golden-shimmer': 'goldenShimmer 2s linear infinite',
        'golden-hover': 'goldenHover 0.4s ease-out',
        'uncontrollable-shiver': 'uncontrollableShiver 0.8s ease-in-out infinite',
        'avatar-shake': 'avatarShake 0.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        keyboardBounce: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '10%': { transform: 'translateY(-8px)' },
          '20%': { transform: 'translateY(-4px)' },
          '30%': { transform: 'translateY(-12px)' },
          '40%': { transform: 'translateY(-2px)' },
          '50%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-6px)' },
          '70%': { transform: 'translateY(-14px)' },
          '80%': { transform: 'translateY(-3px)' },
          '90%': { transform: 'translateY(-7px)' }
        },
        lightbulbFlicker: {
          '0%': { opacity: '0.3', filter: 'brightness(0.8) blur(1px)' },
          '5%': { opacity: '0.9', filter: 'brightness(1.3) blur(0px)' },
          '10%': { opacity: '0.4', filter: 'brightness(0.9) blur(0.5px)' },
          '15%': { opacity: '1', filter: 'brightness(1.4) blur(0px)' },
          '20%': { opacity: '0.6', filter: 'brightness(1.1) blur(0.3px)' },
          '25%': { opacity: '0.95', filter: 'brightness(1.35) blur(0px)' },
          '30%': { opacity: '0.2', filter: 'brightness(0.7) blur(1px)' },
          '35%': { opacity: '1', filter: 'brightness(1.5) blur(0px)' },
          '40%': { opacity: '0.8', filter: 'brightness(1.2) blur(0px)' },
          '45%': { opacity: '0.3', filter: 'brightness(0.8) blur(0.8px)' },
          '50%': { opacity: '1', filter: 'brightness(1.4) blur(0px)' },
          '55%': { opacity: '0.7', filter: 'brightness(1.1) blur(0.2px)' },
          '60%': { opacity: '0.9', filter: 'brightness(1.3) blur(0px)' },
          '65%': { opacity: '0.4', filter: 'brightness(0.9) blur(0.6px)' },
          '70%': { opacity: '1', filter: 'brightness(1.5) blur(0px)' },
          '75%': { opacity: '0.6', filter: 'brightness(1.0) blur(0.4px)' },
          '80%': { opacity: '0.95', filter: 'brightness(1.35) blur(0px)' },
          '85%': { opacity: '0.3', filter: 'brightness(0.8) blur(0.9px)' },
          '90%': { opacity: '1', filter: 'brightness(1.4) blur(0px)' },
          '95%': { opacity: '0.8', filter: 'brightness(1.2) blur(0px)' },
          '100%': { opacity: '0.3', filter: 'brightness(0.8) blur(1px)' }
        },
        ideaLightbulb: {
          '0%': { opacity: '0.1', filter: 'brightness(0.5) blur(2px)', transform: 'scale(0.8)' },
          '10%': { opacity: '0.3', filter: 'brightness(0.7) blur(1px)', transform: 'scale(0.9)' },
          '20%': { opacity: '0.6', filter: 'brightness(1.0) blur(0.5px)', transform: 'scale(1.0)' },
          '30%': { opacity: '0.2', filter: 'brightness(0.6) blur(1.5px)', transform: 'scale(0.85)' },
          '40%': { opacity: '0.8', filter: 'brightness(1.2) blur(0px)', transform: 'scale(1.05)' },
          '50%': { opacity: '0.4', filter: 'brightness(0.8) blur(1px)', transform: 'scale(0.95)' },
          '60%': { opacity: '1.0', filter: 'brightness(1.4) blur(0px)', transform: 'scale(1.1)' },
          '70%': { opacity: '0.3', filter: 'brightness(0.7) blur(1.2px)', transform: 'scale(0.9)' },
          '80%': { opacity: '0.9', filter: 'brightness(1.3) blur(0px)', transform: 'scale(1.05)' },
          '90%': { opacity: '0.5', filter: 'brightness(0.9) blur(0.8px)', transform: 'scale(0.95)' },
          '100%': { opacity: '0.1', filter: 'brightness(0.5) blur(2px)', transform: 'scale(0.8)' }
        },
        furFlutter: {
          '0%': { 
            filter: 'blur(0px) contrast(1) brightness(1) hue-rotate(0deg)',
            transform: 'scale(1) skewX(0deg) skewY(0deg)'
          },
          '25%': { 
            filter: 'blur(0.3px) contrast(1.05) brightness(1.02) hue-rotate(1deg)',
            transform: 'scale(1.002) skewX(0.2deg) skewY(-0.1deg)'
          },
          '50%': { 
            filter: 'blur(0.5px) contrast(1.08) brightness(1.04) hue-rotate(2deg)',
            transform: 'scale(1.004) skewX(-0.1deg) skewY(0.2deg)'
          },
          '75%': { 
            filter: 'blur(0.2px) contrast(1.03) brightness(1.01) hue-rotate(1deg)',
            transform: 'scale(1.001) skewX(0.1deg) skewY(-0.05deg)'
          },
          '100%': { 
            filter: 'blur(0px) contrast(1) brightness(1) hue-rotate(0deg)',
            transform: 'scale(1) skewX(0deg) skewY(0deg)'
          }
        },
        furWave1: {
          '0%': { 
            transform: 'translateX(0px) translateY(0px) rotate(0deg)',
            filter: 'saturate(1) brightness(1)'
          },
          '33%': { 
            transform: 'translateX(0.5px) translateY(-0.3px) rotate(0.1deg)',
            filter: 'saturate(1.02) brightness(1.01)'
          },
          '66%': { 
            transform: 'translateX(-0.3px) translateY(0.4px) rotate(-0.05deg)',
            filter: 'saturate(1.01) brightness(1.02)'
          },
          '100%': { 
            transform: 'translateX(0px) translateY(0px) rotate(0deg)',
            filter: 'saturate(1) brightness(1)'
          }
        },
        furWave2: {
          '0%': { 
            transform: 'translateX(0px) translateY(0px) scaleX(1) scaleY(1)',
            filter: 'contrast(1) brightness(1)'
          },
          '40%': { 
            transform: 'translateX(-0.2px) translateY(0.3px) scaleX(1.001) scaleY(0.999)',
            filter: 'contrast(1.02) brightness(1.01)'
          },
          '80%': { 
            transform: 'translateX(0.4px) translateY(-0.2px) scaleX(0.999) scaleY(1.001)',
            filter: 'contrast(1.01) brightness(1.02)'
          },
          '100%': { 
            transform: 'translateX(0px) translateY(0px) scaleX(1) scaleY(1)',
            filter: 'contrast(1) brightness(1)'
          }
        },
        furShimmer: {
          '0%': { 
            filter: 'brightness(1) saturate(1) hue-rotate(0deg)',
            transform: 'perspective(100px) rotateX(0deg) rotateY(0deg)'
          },
          '25%': { 
            filter: 'brightness(1.03) saturate(1.05) hue-rotate(0.5deg)',
            transform: 'perspective(100px) rotateX(0.1deg) rotateY(-0.05deg)'
          },
          '50%': { 
            filter: 'brightness(1.06) saturate(1.08) hue-rotate(1deg)',
            transform: 'perspective(100px) rotateX(-0.05deg) rotateY(0.1deg)'
          },
          '75%': { 
            filter: 'brightness(1.02) saturate(1.03) hue-rotate(0.3deg)',
            transform: 'perspective(100px) rotateX(0.05deg) rotateY(-0.02deg)'
          },
          '100%': { 
            filter: 'brightness(1) saturate(1) hue-rotate(0deg)',
            transform: 'perspective(100px) rotateX(0deg) rotateY(0deg)'
          }
        },
        slideInFromTop: {
          '0%': { 
            transform: 'translateY(-100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        fadeUpFromBottom: {
          '0%': { 
            transform: 'translateY(30px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        confettiFall: {
          '0%': { 
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh) rotate(360deg)',
            opacity: '0'
          }
        },
        confettiSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        checkmarkDraw: {
          '0%': { 
            strokeDasharray: '0 100',
            opacity: '0'
          },
          '50%': {
            opacity: '1'
          },
          '100%': { 
            strokeDasharray: '100 0',
            opacity: '1'
          }
        },
        metallicShimmer: {
          '0%': { 
            backgroundPosition: '-200% center'
          },
          '100%': { 
            backgroundPosition: '200% center'
          }
        },
        goldenSparkle: {
          '0%': { 
            filter: 'brightness(1.4) saturate(1.8) sepia(0.8) hue-rotate(25deg) contrast(1.2)',
            transform: 'scale(1)'
          },
          '25%': { 
            filter: 'brightness(1.6) saturate(2.0) sepia(0.9) hue-rotate(30deg) contrast(1.3)',
            transform: 'scale(1.02)'
          },
          '50%': { 
            filter: 'brightness(1.8) saturate(2.2) sepia(1.0) hue-rotate(35deg) contrast(1.4)',
            transform: 'scale(1.04)'
          },
          '75%': { 
            filter: 'brightness(1.6) saturate(2.0) sepia(0.9) hue-rotate(30deg) contrast(1.3)',
            transform: 'scale(1.02)'
          },
          '100%': { 
            filter: 'brightness(1.4) saturate(1.8) sepia(0.8) hue-rotate(25deg) contrast(1.2)',
            transform: 'scale(1)'
          }
        },
        goldenPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.1)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.2)'
          }
        },
        goldenShimmer: {
          '0%': { 
            backgroundImage: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
            backgroundPosition: '-100% 0'
          },
          '100%': { 
            backgroundPosition: '100% 0'
          }
        },
        goldenHover: {
          '0%': { 
            filter: 'brightness(1.4) saturate(1.8) sepia(0.8) hue-rotate(25deg) contrast(1.2)',
            transform: 'scale(1)'
          },
          '100%': { 
            filter: 'brightness(2.0) saturate(2.5) sepia(1.0) hue-rotate(40deg) contrast(1.5)',
            transform: 'scale(1.05)'
          }
        },
        uncontrollableShiver: {
          '0%': { transform: 'translateX(0px) translateY(0px) rotate(0deg)' },
          '5%': { transform: 'translateX(-2px) translateY(1px) rotate(-0.5deg)' },
          '10%': { transform: 'translateX(3px) translateY(-1px) rotate(0.8deg)' },
          '15%': { transform: 'translateX(-1px) translateY(2px) rotate(-0.3deg)' },
          '20%': { transform: 'translateX(2px) translateY(-2px) rotate(0.6deg)' },
          '25%': { transform: 'translateX(-3px) translateY(1px) rotate(-0.7deg)' },
          '30%': { transform: 'translateX(1px) translateY(-1px) rotate(0.4deg)' },
          '35%': { transform: 'translateX(-2px) translateY(3px) rotate(-0.9deg)' },
          '40%': { transform: 'translateX(4px) translateY(-1px) rotate(0.5deg)' },
          '45%': { transform: 'translateX(-1px) translateY(2px) rotate(-0.6deg)' },
          '50%': { transform: 'translateX(2px) translateY(-3px) rotate(0.8deg)' },
          '55%': { transform: 'translateX(-3px) translateY(1px) rotate(-0.4deg)' },
          '60%': { transform: 'translateX(1px) translateY(-2px) rotate(0.7deg)' },
          '65%': { transform: 'translateX(-2px) translateY(2px) rotate(-0.5deg)' },
          '70%': { transform: 'translateX(3px) translateY(-1px) rotate(0.6deg)' },
          '75%': { transform: 'translateX(-1px) translateY(3px) rotate(-0.8deg)' },
          '80%': { transform: 'translateX(2px) translateY(-2px) rotate(0.4deg)' },
          '85%': { transform: 'translateX(-4px) translateY(1px) rotate(-0.7deg)' },
          '90%': { transform: 'translateX(1px) translateY(-1px) rotate(0.9deg)' },
          '95%': { transform: 'translateX(-2px) translateY(2px) rotate(-0.3deg)' },
          '100%': { transform: 'translateX(0px) translateY(0px) rotate(0deg)' }
        },
        avatarShake: {
          '0%': { transform: 'translateX(0px) translateY(0px) rotate(0deg)' },
          '10%': { transform: 'translateX(-1px) translateY(0.5px) rotate(-0.2deg)' },
          '20%': { transform: 'translateX(1.5px) translateY(-0.8px) rotate(0.3deg)' },
          '30%': { transform: 'translateX(-0.8px) translateY(1px) rotate(-0.15deg)' },
          '40%': { transform: 'translateX(1.2px) translateY(-0.6px) rotate(0.25deg)' },
          '50%': { transform: 'translateX(-1px) translateY(0.8px) rotate(-0.3deg)' },
          '60%': { transform: 'translateX(0.8px) translateY(-1px) rotate(0.2deg)' },
          '70%': { transform: 'translateX(-1.2px) translateY(0.6px) rotate(-0.25deg)' },
          '80%': { transform: 'translateX(0.6px) translateY(-0.8px) rotate(0.3deg)' },
          '90%': { transform: 'translateX(-0.8px) translateY(1px) rotate(-0.2deg)' },
          '100%': { transform: 'translateX(0px) translateY(0px) rotate(0deg)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },
        glowBlue: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.1)' 
          }
        },
        shimmerFast: {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '50%': { 
            transform: 'translateX(0%)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateX(100%)',
            opacity: '0'
          }
        },
        dotFade: {
          '0%, 80%, 100%': { 
            opacity: '0.3'
          },
          '40%': { 
            opacity: '1'
          }
        }
      },
      spacing: {
        'safe-area-pb': 'env(safe-area-inset-bottom)',
        'safe-area-pt': 'env(safe-area-inset-top)',
        'safe-area-pl': 'env(safe-area-inset-left)',
        'safe-area-pr': 'env(safe-area-inset-right)',
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios-md': '10px',
        'ios-lg': '12px',
        'ios-xl': '16px',
        'ios-2xl': '20px',
      },
      boxShadow: {
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'ios-md': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'ios-lg': '0 8px 16px rgba(0, 0, 0, 0.12)',
        'ios-xl': '0 12px 24px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-outline-dark-brown': {
          textShadow: '2px 2px 0 #4A2C2A, -2px -2px 0 #4A2C2A, 2px -2px 0 #4A2C2A, -2px 2px 0 #4A2C2A, 0px 2px 0 #4A2C2A, 2px 0px 0 #4A2C2A, 0px -2px 0 #4A2C2A, -2px 0px 0 #4A2C2A'
        },
        '.filter-gold': {
          filter: 'brightness(1.8) saturate(2.2) sepia(1.0) hue-rotate(35deg) contrast(1.4)'
        },
        '.halo-glow': {
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6), 0 0 80px rgba(255, 255, 255, 0.4), 0 0 120px rgba(255, 255, 255, 0.2), 0 0 160px rgba(255, 255, 255, 0.1)'
        },
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.px-safe': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.py-safe': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.top-safe': {
          top: 'env(safe-area-inset-top)',
        },
        '.bottom-safe': {
          bottom: 'env(safe-area-inset-bottom)',
        },
        '.left-safe': {
          left: 'env(safe-area-inset-left)',
        },
        '.right-safe': {
          right: 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};