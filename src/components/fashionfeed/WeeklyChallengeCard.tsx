/**
 * Weekly Challenge Card
 * Displays weekly fashion challenges with confetti celebration
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
import Confetti from 'react-confetti';
import weeklyChallengeService from '../../services/weeklyChallengeService';
import { supabase } from '../../services/supabaseClient';
import './WeeklyChallengeCard.css';

export default function WeeklyChallengeCard() {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [compliment, setCompliment] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadChallenge();
    
    // Check completion every 30 seconds if challenge is accepted
    const interval = setInterval(() => {
      if (challenge?.accepted_at && !challenge?.completed_at) {
        checkIfCompleted();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [challenge?.id]);

  const loadChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weeklyChallenge = await weeklyChallengeService.generateWeeklyChallenge(user.id);
      setChallenge(weeklyChallenge);
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!challenge || accepting) return;
    
    setAccepting(true);
    try {
      await weeklyChallengeService.acceptChallenge(challenge.id);
      setChallenge({ ...challenge, accepted_at: new Date().toISOString() });
    } catch (error) {
      console.error('Error accepting challenge:', error);
    } finally {
      setAccepting(false);
    }
  };

  const checkIfCompleted = async () => {
    if (!challenge || challenge.completed_at) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const result = await weeklyChallengeService.checkCompletion(user.id, challenge.id);
      
      if (result.completed) {
        setCompliment(result.compliment || 'You nailed it! 🎉');
        setShowConfetti(true);
        setShowBanner(true);
        
        // Refresh challenge
        await loadChallenge();
        
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="challenge-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-button"></div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Challenge Complete Banner */}
      {showBanner && (
        <div className="challenge-complete-banner" onClick={(e) => e.stopPropagation()}>
          <div className="banner-content">
            <Check className="w-10 h-10 text-green-500 mb-2" />
            <h3 className="text-xl font-bold mb-2">Challenge Complete! ✨</h3>
            <p className="text-gray-700 mb-4">{compliment}</p>
            <button 
              onClick={() => setShowBanner(false)}
              className="banner-close-btn"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Challenge Card */}
      <div className="weekly-challenge-card">
        <div className="challenge-header">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h4 className="font-semibold text-gray-800">Challenge This Week</h4>
        </div>

        <p className="challenge-text">{challenge.challenge_text}</p>

        {challenge.completed_at ? (
          <div className="challenge-completed">
            <Check className="w-5 h-5 text-green-500" />
            <span>Completed! 🎉</span>
          </div>
        ) : challenge.accepted_at ? (
          <div className="challenge-in-progress">
            <div className="progress-dot"></div>
            <span>In Progress...</span>
          </div>
        ) : (
          <button 
            onClick={handleAccept}
            disabled={accepting}
            className="accept-challenge-btn"
          >
            {accepting ? 'Accepting...' : 'Accept Challenge'}
          </button>
        )}
      </div>
    </>
  );
}
