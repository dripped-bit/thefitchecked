import React from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading your wardrobe..." }) => {
  return (
    <div className="loading-screen fade-in">
      <div className="loading-content">
        <video
          className="loading-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/loading-animation.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <p className="text-white text-xl">{message}</p>
        </video>
      </div>
    </div>
  );
};

export default LoadingScreen;
