import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [show, setShow] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setFadeOut(false);
    } else {
      setFadeOut(true);
      setTimeout(() => setShow(false), 500);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="loading-content">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="loading-video"
        >
          <source src="/loading-animation.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

export default LoadingScreen;