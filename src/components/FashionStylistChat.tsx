/**
 * Fashion Stylist Chat Interface
 * Full-screen chat modal for AI fashion advice
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Camera, Loader, Sparkles } from 'lucide-react';
import fashionStylistService, { StylistMessage } from '../services/fashionStylistService';
import haptics from '../utils/haptics';
import '../styles/fashion-stylist.css';

interface FashionStylistChatProps {
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  "What should I wear to a beach wedding?",
  "How do I style these boots?",
  "Help me pack for cold weather",
  "What's missing in my closet?",
  "Show me outfits from my closet",
  "What colors go with navy blue?"
];

const FashionStylistChat: React.FC<FashionStylistChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<StylistMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTED_PROMPTS.slice(0, 4));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: StylistMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    haptics.light();

    try {
      const response = await fashionStylistService.askStylist(inputValue);

      const assistantMessage: StylistMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }

      haptics.success();
    } catch (error) {
      console.error('❌ [CHAT] Error:', error);
      
      const errorMessage: StylistMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    haptics.light();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  return (
    <div className="stylist-chat-overlay" onClick={handleClose}>
      <div className="stylist-chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stylist-chat-header">
          <div className="header-content">
            <Sparkles className="header-icon" size={20} />
            <div>
              <h2 className="header-title">Your AI Stylist</h2>
              <p className="header-subtitle">Powered by AI • Fashion Expert</p>
            </div>
          </div>
          <button onClick={handleClose} className="close-button" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="stylist-chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-icon">✨</div>
              <h3>Hi! I'm Your Stylist</h3>
              <p className="welcome-text">
                I can help you with outfit suggestions, styling tips, shopping advice, and wardrobe planning.
              </p>
              <div className="welcome-prompts">
                <p className="welcome-prompts-title">Try asking:</p>
                <ul>
                  <li>💬 "What should I wear today?"</li>
                  <li>📸 "How do I style this?" (+ photo)</li>
                  <li>🧳 "Help me pack for my trip"</li>
                  <li>🛍️ "What's missing in my closet?"</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-bubble ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="message-avatar">✨</div>
                  )}
                  <div className="message-content">
                    <p className="message-text">{message.content}</p>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message-bubble assistant-message">
                  <div className="message-avatar">✨</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <Loader className="typing-spinner" size={16} />
                      <span>Styling...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && !isLoading && (
          <div className="suggestion-chips">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="stylist-chat-input">
          <button className="camera-button" aria-label="Add photo">
            <Camera size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about fashion..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FashionStylistChat;
