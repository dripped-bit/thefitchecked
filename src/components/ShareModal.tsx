/**
 * Share Modal Component
 * Provides UI for sharing outfits via link, social media, or download
 */

import React, { useState } from 'react';
import {
  X,
  Share2,
  Link,
  Download,
  Check,
  Instagram,
  Facebook,
  Twitter,
  Eye,
  EyeOff
} from 'lucide-react';
import shareService, { SharedOutfitData } from '../services/shareService';

interface ShareModalProps {
  outfitData: Omit<SharedOutfitData, 'id' | 'timestamp' | 'privacy'>;
  onClose: () => void;
  onDownload?: (shareId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  outfitData,
  onClose,
  onDownload
}) => {
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    hideFace: false,
    outfitOnly: false,
    allowSharing: true
  });

  // Create share on mount
  React.useEffect(() => {
    handleCreateShare();
  }, []);

  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      const id = await shareService.createShare(outfitData);
      setShareId(id);

      // Apply privacy settings
      if (privacySettings.hideFace || privacySettings.outfitOnly) {
        await shareService.updatePrivacy(id, privacySettings);
      }
    } catch (error) {
      console.error('Failed to create share:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareId) return;

    const success = await shareService.copyShareUrl(shareId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'pinterest' | 'instagram') => {
    if (!shareId) return;

    const message = `Check out this ${outfitData.outfitDetails.occasion || 'outfit'} I created!`;
    const urls = shareService.generateSocialShareUrls(shareId, message);

    if (platform === 'instagram') {
      handleCopyLink(); // Instagram doesn't support web sharing
      alert('Link copied! Share it on Instagram Stories or Posts');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleDownload = () => {
    if (!shareId) return;
    onDownload?.(shareId);
  };

  const handlePrivacyToggle = async (setting: keyof typeof privacySettings) => {
    const newSettings = { ...privacySettings, [setting]: !privacySettings[setting] };
    setPrivacySettings(newSettings);

    if (shareId) {
      await shareService.updatePrivacy(shareId, newSettings);
    }
  };

  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Share2 className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Share Link...</h3>
            <p className="text-gray-600">Preparing your outfit to share</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Share Your Outfit</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Outfit Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-4">
              <img
                src={outfitData.avatarImageUrl}
                alt="Outfit preview"
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {outfitData.outfitDetails.occasion || outfitData.outfitDetails.description}
                </h3>
                {outfitData.outfitDetails.formality && (
                  <p className="text-sm text-gray-600 capitalize">
                    {outfitData.outfitDetails.formality} Attire
                  </p>
                )}
                {outfitData.outfitDetails.weather && (
                  <p className="text-sm text-gray-500">{outfitData.outfitDetails.weather}</p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Privacy Settings</h4>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                {privacySettings.hideFace ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                <div>
                  <p className="font-medium text-gray-900">Hide Face</p>
                  <p className="text-sm text-gray-500">Blur avatar face in shared image</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.hideFace}
                onChange={() => handlePrivacyToggle('hideFace')}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <Share2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Outfit Only</p>
                  <p className="text-sm text-gray-500">Share outfit without avatar</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.outfitOnly}
                onChange={() => handlePrivacyToggle('outfitOnly')}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Share Options</h4>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              disabled={!shareId}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                {copied ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
                <span className="font-semibold">
                  {copied ? 'Link Copied!' : 'Copy Share Link'}
                </span>
              </div>
            </button>

            {/* Download Image */}
            {onDownload && (
              <button
                onClick={handleDownload}
                disabled={!shareId}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Save as Image</span>
                </div>
              </button>
            )}

            {/* Social Media */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialShare('twitter')}
                disabled={!shareId}
                className="flex items-center justify-center space-x-2 p-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Twitter className="w-5 h-5" />
                <span className="font-medium">Twitter</span>
              </button>

              <button
                onClick={() => handleSocialShare('facebook')}
                disabled={!shareId}
                className="flex items-center justify-center space-x-2 p-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Facebook className="w-5 h-5" />
                <span className="font-medium">Facebook</span>
              </button>

              <button
                onClick={() => handleSocialShare('instagram')}
                disabled={!shareId}
                className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Instagram className="w-5 h-5" />
                <span className="font-medium">Instagram</span>
              </button>

              <button
                onClick={() => handleSocialShare('pinterest')}
                disabled={!shareId}
                className="flex items-center justify-center space-x-2 p-3 bg-[#E60023] text-white rounded-lg hover:bg-[#d0001f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
                <span className="font-medium">Pinterest</span>
              </button>
            </div>
          </div>

          {/* Share URL Display */}
          {shareId && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-medium mb-2">Share URL</p>
              <p className="text-sm text-purple-900 font-mono break-all">
                {shareService.generateShareUrl(shareId)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
