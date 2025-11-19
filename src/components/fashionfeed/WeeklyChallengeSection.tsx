/**
 * Weekly Challenge Section
 * AI-generated styling challenge to encourage creativity
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';
import aiStyleAnalysisService from '../../services/aiStyleAnalysisService';

interface WeeklyChallengeSectionProps {
  items: ClothingItem[];
}

export default function WeeklyChallengeSection({ items }: WeeklyChallengeSectionProps) {
  const [challenge, setChallenge] = useState<{
    title: string;
    description: string;
    items: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      loadChallenge();
    } else {
      setLoading(false);
    }
  }, [items]);

  const loadChallenge = async () => {
    setLoading(true);
    
    try {
      const analysis = await aiStyleAnalysisService.analyzeStyle(items);
      setChallenge(analysis.weeklyChallenge);
    } catch (err) {
      console.error('Error loading weekly challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = () => {
    setAccepted(true);
    // Could save to local storage or backend
    localStorage.setItem('weekly_challenge_accepted', new Date().toISOString());
  };

  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="magazine-box magazine-box-blue">
        <div className="text-center py-8">
          <div className="animate-pulse text-4xl mb-4">✨</div>
          <p className="handwritten text-xl text-gray-500">
            Generating your challenge...
          </p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="magazine-box magazine-box-blue animate-fadeInUp">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-block">
          <h2 className="cutout-text text-4xl mb-2">
            WEEKLY CHALLENGE
          </h2>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Push Your Style Boundaries
            </p>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Challenge Card */}
      <div className="relative">
        {/* Decorative corner */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full opacity-20 blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-400 rounded-full opacity-20 blur-xl" />

        <div className="relative bg-white rounded-2xl p-6 shadow-heavy border-4 border-black">
          {/* Challenge Title */}
          <div className="mb-4">
            <div className="sticker sticker-purple mb-3">
              <Sparkles className="w-4 h-4" />
              <span>THIS WEEK</span>
            </div>
            <h3 className="text-2xl font-black mb-2">{challenge.title}</h3>
            <p className="handwritten text-xl text-gray-700">
              {challenge.description}
            </p>
          </div>

          {/* Challenge Items/Steps */}
          <div className="space-y-3 mb-6">
            {challenge.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-700">{item}</p>
              </div>
            ))}
          </div>

          {/* Accept Challenge Button */}
          {!accepted ? (
            <button
              onClick={handleAcceptChallenge}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Accept Challenge! 🚀
            </button>
          ) : (
            <div className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>Challenge Accepted!</span>
            </div>
          )}

          {/* Encouragement */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 italic">
              Tag your challenge outfit with #WeeklyChallengeAccepted
            </p>
          </div>
        </div>
      </div>

      {/* Motivation Quote */}
      <div className="mt-6">
        <div className="speech-bubble">
          <p className="handwritten text-lg text-center">
            "Step out of your comfort zone and surprise yourself! ✨"
          </p>
        </div>
      </div>
    </div>
  );
}
