/**
 * Style Quiz Component
 * 6-question interactive quiz with scrapbook aesthetic
 */

import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import styleQuizService, { QuizAnswers, StyleQuizResult } from '../../services/styleQuizService';

interface StyleQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: StyleQuizResult) => void;
}

// Question type definitions
interface QuizQuestion {
  id: number;
  type: 'image-grid' | 'scenario' | 'motivation' | 'color-palette' | 'priority' | 'influencers';
  title: string;
  subtitle?: string;
  options: any[];
  multiSelect: boolean;
  maxSelections?: number;
}

export default function StyleQuiz({ isOpen, onClose, onComplete }: StyleQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Define all 6 questions
  const questions: QuizQuestion[] = [
    // Q1: Visual Style Board
    {
      id: 0,
      type: 'image-grid',
      title: 'Which vibe is YOU? ✨',
      multiSelect: true,
      maxSelections: 3,
      options: [
        { id: 'minimal', label: 'Minimal Chic', description: 'Clean lines', value: 'minimalist' },
        { id: 'boho', label: 'Boho Free', description: 'Flowy vibes', value: 'bohemian' },
        { id: 'classic', label: 'Classic Elegant', description: 'Timeless', value: 'classic' },
        { id: 'edgy', label: 'Edgy Modern', description: 'Statement', value: 'edgy' },
        { id: 'romantic', label: 'Romantic Soft', description: 'Feminine', value: 'romantic' },
        { id: 'sporty', label: 'Sporty Casual', description: 'Comfy', value: 'sporty' },
      ],
    },
    // Q2: Weekend Outfit
    {
      id: 1,
      type: 'scenario',
      title: 'SATURDAY MORNING 🌤️',
      subtitle: "No plans yet. What's on?",
      multiSelect: false,
      options: [
        { id: 'cozy', emoji: '🧸', title: 'Cozy Queen', description: 'Oversized sweater, leggings, sneakers', value: 'comfort-first' },
        { id: 'effortless', emoji: '😎', title: 'Effortless Cool', description: 'Jeans, white tee, leather jacket', value: 'casual-cool' },
        { id: 'put-together', emoji: '👗', title: 'Put Together', description: 'Midi dress, ankle boots', value: 'dressed-up' },
        { id: 'athleisure', emoji: '🏃‍♀️', title: 'Active Mode', description: 'Leggings, sports bra, hoodie', value: 'athletic' },
      ],
    },
    // Q3: Shopping Trigger
    {
      id: 2,
      type: 'motivation',
      title: '🛍️ SHOPPING VIBES',
      subtitle: "You're most likely to buy when...",
      multiSelect: true,
      maxSelections: 2,
      options: [
        { id: 'inspiration', icon: '⭐', title: 'Inspiration Strikes', quote: '"Saw it on someone I love!"', value: 'inspiration-driven' },
        { id: 'event', icon: '📅', title: 'Event Coming Up', quote: '"Need something for the trip!"', value: 'occasion-based' },
        { id: 'deal', icon: '💰', title: 'Smart Deal', quote: '"On sale AND practical!"', value: 'value-conscious' },
        { id: 'love', icon: '💕', title: 'Love at First Sight', quote: '"I need it NOW!"', value: 'impulse-buyer' },
        { id: 'strategic', icon: '🎯', title: 'Strategic Gap', quote: '"Researched, fills a need"', value: 'planned-shopper' },
        { id: 'seasonal', icon: '🍂', title: 'Season Changes', quote: '"Time to refresh wardrobe!"', value: 'seasonal-refresher' },
      ],
    },
    // Q4: Color Palette
    {
      id: 3,
      type: 'color-palette',
      title: '🎨 YOUR COLOR STORY',
      subtitle: 'Which looks like your closet?',
      multiSelect: false,
      options: [
        { id: 'neutrals', title: 'All Neutrals 🤍🖤', colors: ['#000000', '#FFFFFF', '#8B7355', '#808080'], emojis: ['⬛', '⬜', '🤎'], description: 'Black, white, gray, camel', value: 'neutral-palette' },
        { id: 'neutrals-pop', title: 'Neutrals + Pop 💙', colors: ['#000000', '#FFFFFF', '#808080', '#4A90E2'], emojis: ['⬛', '⬜', '🟦'], description: 'Neutrals + one signature color', value: 'neutral-with-accent' },
        { id: 'earth', title: 'Earth Tones 🍂', colors: ['#8B4513', '#A0522D', '#6B8E23', '#CD853F'], emojis: ['🟤', '🟫', '🫒'], description: 'Browns, tans, olive, rust', value: 'earth-tones' },
        { id: 'pastels', title: 'Soft Pastels 🌸', colors: ['#FFB6C1', '#DDA0DD', '#B0E0E6', '#FFFACD'], emojis: ['🩷', '💜', '🩵'], description: 'Pink, lavender, mint, cream', value: 'pastel-palette' },
        { id: 'bold', title: 'Bold & Bright 🌈', colors: ['#FF1493', '#FF4500', '#4169E1', '#32CD32'], emojis: ['🔴', '🟠', '🔵', '🟢'], description: 'Vibrant, saturated colors', value: 'bold-colors' },
        { id: 'monochrome', title: 'Monochrome Only ⚫', colors: ['#000000', '#FFFFFF', '#404040', '#C0C0C0'], emojis: ['⬛', '⬜'], description: 'Black, white, gray only', value: 'monochrome' },
      ],
    },
    // Q5: Fit Priority
    {
      id: 4,
      type: 'priority',
      title: '💡 WHAT MATTERS MOST?',
      subtitle: 'When trying clothes on...',
      multiSelect: true,
      maxSelections: 2,
      options: [
        { id: 'confidence', icon: '✨', title: 'Confidence Boost', quote: '"Makes me feel amazing!"', value: 'confidence' },
        { id: 'comfort', icon: '☁️', title: 'All-Day Comfort', quote: '"Can wear from AM to PM"', value: 'comfort' },
        { id: 'fit', icon: '👔', title: 'Perfect Fit', quote: '"Tailored to my body"', value: 'fit' },
        { id: 'trendy', icon: '📸', title: 'Instagram Worthy', quote: '"Trendy & fashionable!"', value: 'trend' },
        { id: 'versatile', icon: '🔄', title: 'Mix & Match', quote: '"Works with everything!"', value: 'versatility' },
        { id: 'unique', icon: '🦄', title: 'Stand Out', quote: '"Nobody else has this!"', value: 'uniqueness' },
      ],
    },
    // Q6: Style Icons
    {
      id: 5,
      type: 'influencers',
      title: '👑 WHOSE STYLE VIBES?',
      subtitle: 'Pick up to 3 style crushes!',
      multiSelect: true,
      maxSelections: 3,
      options: [
        { id: 'hailey', name: 'Hailey Bieber', style: 'Minimal', value: 'minimalist-modern' },
        { id: 'zendaya', name: 'Zendaya', style: 'Bold', value: 'bold-experimental' },
        { id: 'taylor', name: 'Taylor Swift', style: 'Romantic', value: 'romantic-classic' },
        { id: 'gigi', name: 'Gigi Hadid', style: 'Sporty', value: 'sporty-chic' },
        { id: 'meghan', name: 'Meghan Markle', style: 'Classic', value: 'classic-elegant' },
        { id: 'rihanna', name: 'Rihanna', style: 'Edgy', value: 'edgy-street' },
        { id: 'sienna', name: 'Sienna Miller', style: 'Boho', value: 'boho-chic' },
        { id: 'kendall', name: 'Kendall Jenner', style: 'Model', value: 'model-off-duty' },
      ],
    },
  ];

  const handleAnswer = (value: any) => {
    const question = questions[currentQuestion];
    const key = getAnswerKey(currentQuestion);
    
    if (question.multiSelect) {
      const currentValues = (answers[key] as string[]) || [];
      let newValues: string[];
      
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value);
      } else {
        if (question.maxSelections && currentValues.length >= question.maxSelections) {
          return; // Max selections reached
        }
        newValues = [...currentValues, value];
      }
      
      setAnswers(prev => ({ ...prev, [key]: newValues }));
    } else {
      setAnswers(prev => ({ ...prev, [key]: value }));
    }
    
    Haptics.impact({ style: 'light' });
  };

  const getAnswerKey = (questionIndex: number): keyof QuizAnswers => {
    const keys: (keyof QuizAnswers)[] = [
      'visualStyle',
      'weekendOutfit',
      'shoppingTrigger',
      'colorPalette',
      'fitPriority',
      'styleIcons',
    ];
    return keys[questionIndex];
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      Haptics.impact({ style: 'medium' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      Haptics.impact({ style: 'light' });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsAnalyzing(true);
      Haptics.notification({ type: 'success' });

      // Ensure all answers are present with defaults
      const completeAnswers: QuizAnswers = {
        visualStyle: (answers.visualStyle as string[]) || [],
        weekendOutfit: answers.weekendOutfit || '',
        shoppingTrigger: (answers.shoppingTrigger as string[]) || [],
        colorPalette: answers.colorPalette || '',
        fitPriority: (answers.fitPriority as string[]) || [],
        styleIcons: (answers.styleIcons as string[]) || [],
      };

      // Analyze and save with AI
      const results = await styleQuizService.completeQuiz(completeAnswers);

      // Show results
      onComplete(results);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setIsAnalyzing(false);
      alert('Oops! Something went wrong analyzing your style. Please try again.');
    }
  };

  const getCurrentAnswer = () => {
    const key = getAnswerKey(currentQuestion);
    return answers[key];
  };

  const isAnswered = () => {
    const answer = getCurrentAnswer();
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  if (!isOpen) return null;

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="quiz-modal">
        <div className="quiz-loading">
          <div className="sparkle-animation">✨ ✨ ✨</div>
          <h3 className="analyzing-text">
            Analyzing Your Style...
          </h3>
          <p className="text-gray-600 mt-2">
            Finding your fashion DNA 🧬
          </p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const currentAnswer = getCurrentAnswer();

  return (
    <div className="quiz-modal">
      <div className="quiz-content">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{ visibility: currentQuestion > 0 ? 'visible' : 'hidden' }}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="quiz-progress">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`progress-dot ${idx <= currentQuestion ? 'active' : ''}`}
              />
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors z-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="magazine-headline text-2xl md:text-3xl mb-2">
              {question.title}
            </h2>
            {question.subtitle && (
              <p className="text-gray-600 text-lg">
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Render question based on type */}
          {question.type === 'image-grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswer(option.value)}
                  className={`polaroid-option ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(option.value) ? 'selected' : ''
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded flex items-center justify-center">
                    <span className="text-4xl">{option.label.slice(0, 2)}</span>
                  </div>
                  <div className="polaroid-label">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'scenario' && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswer(option.value)}
                  className={`scenario-card ${currentAnswer === option.value ? 'selected' : ''}`}
                >
                  <div className="p-5">
                    <div className="scenario-emoji">{option.emoji}</div>
                    <h3 className="font-bold text-xl mb-2">{option.title}</h3>
                    <p className="text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'motivation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswer(option.value)}
                  className={`sticker-badge ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(option.value) ? 'selected' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-bold text-lg mb-1">{option.title}</div>
                  <div className="quote-text">{option.quote}</div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'color-palette' && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswer(option.value)}
                  className={`color-palette-option ${currentAnswer === option.value ? 'selected' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {option.colors.map((color: string, idx: number) => (
                        <div
                          key={idx}
                          className="color-swatch"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{option.title}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'priority' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleAnswer(option.value)}
                  className={`sticker-badge ${
                    Array.isArray(currentAnswer) && currentAnswer.includes(option.value) ? 'selected' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-bold text-lg mb-1">{option.title}</div>
                  <div className="quote-text">{option.quote}</div>
                </div>
              ))}
            </div>
          )}

          {question.type === 'influencers' && (
            <div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleAnswer(option.value)}
                    className={`mini-polaroid ${
                      Array.isArray(currentAnswer) && currentAnswer.includes(option.value) ? 'selected' : ''
                    }`}
                  >
                    <div className="mini-polaroid-img bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <span className="text-2xl">{option.name.slice(0, 2)}</span>
                    </div>
                    <div className="mini-polaroid-name">{option.name}</div>
                    <div className="text-center text-xs text-gray-500 mt-1">{option.style}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(currentAnswer) && currentAnswer.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                  Selected: {currentAnswer.length}/{question.maxSelections || 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleNext}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Question →
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            disabled={!isAnswered()}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {currentQuestion === questions.length - 1 ? 'See My Results! ✨' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
