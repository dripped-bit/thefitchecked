/**
 * Share Stats Modal
 * Allows users to select and share analytics story templates
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Instagram,
  Twitter,
  Facebook,
  Loader,
  Check,
  Copy
} from 'lucide-react';
import socialShareService, { StoryTemplate } from '../services/socialShareService';
import { AnalyticsData } from '../services/closetAnalyticsService';

interface ShareStatsModalProps {
  data: AnalyticsData;
  onClose: () => void;
}

interface TemplateOption {
  id: StoryTemplate;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'big-spender',
    name: 'Big Spender',
    emoji: '💰',
    description: 'Show off your top spending category',
    color: 'from-yellow-400 to-black'
  },
  {
    id: 'closet-value',
    name: 'Closet Value',
    emoji: '💎',
    description: 'Reveal your total wardrobe worth',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'usage-check',
    name: 'Reality Check',
    emoji: '⚠️',
    description: 'Show how little you actually wear',
    color: 'from-orange-400 to-red-600'
  },
  {
    id: 'best-value',
    name: 'Best Value',
    emoji: '🏆',
    description: 'Highlight your cost-per-wear winner',
    color: 'from-green-400 to-green-700'
  }
];

export default function ShareStatsModal({ data, onClose }: ShareStatsModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate>('big-spender');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate preview when template changes
  useEffect(() => {
    generatePreview();
  }, [selectedTemplate]);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const imageDataUrl = await socialShareService.generateStoryImage({
        template: selectedTemplate,
        data
      });
      setGeneratedImage(imageDataUrl);
    } catch (error) {
      console.error('❌ Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    socialShareService.downloadImage(
      generatedImage,
      `closet-stats-${template?.name.toLowerCase().replace(' ', '-')}`
    );
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    await socialShareService.shareNative(
      generatedImage,
      `My Closet ${template?.name} Stats`
    );
  };

  const handleCopy = async () => {
    if (!generatedImage) return;
    const success = await socialShareService.copyToClipboard(generatedImage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSocialShare = (platform: 'instagram' | 'twitter' | 'facebook') => {
    const urls = socialShareService.getSocialShareUrls(
      'Check out my closet analytics! 👗✨',
      generatedImage || undefined
    );
    
    if (platform === 'instagram') {
      // Instagram requires downloading first
      handleDownload();
      alert('Image downloaded! Open Instagram and upload to your story.');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📸 Share Your Stats</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create an Instagram or TikTok story
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Choose a Template</h3>
              <div className="space-y-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{template.emoji}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </div>
                        {/* Color preview */}
                        <div
                          className={`h-2 rounded-full mt-2 bg-gradient-to-r ${template.color}`}
                        />
                      </div>
                      {selectedTemplate === template.id && (
                        <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-100 rounded-xl aspect-[9/16] relative overflow-hidden shadow-lg">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Share2 className="w-12 h-12 mx-auto mb-2" />
                      <p>Generating preview...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Share Actions */}
              {generatedImage && !isGenerating && (
                <div className="mt-4 space-y-3">
                  {/* Primary Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShare}
                      className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                    <button
                      onClick={handleDownload}
                      className="bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>

                  {/* Copy to Clipboard */}
                  <button
                    onClick={handleCopy}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Image
                      </>
                    )}
                  </button>

                  {/* Social Platforms */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-3 text-center">
                      Or share directly to:
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleSocialShare('instagram')}
                        className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl hover:shadow-lg transition-all"
                        title="Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleSocialShare('twitter')}
                        className="p-3 bg-blue-400 text-white rounded-xl hover:shadow-lg transition-all"
                        title="Twitter"
                      >
                        <Twitter className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleSocialShare('facebook')}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                        title="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Images are optimized for Instagram & TikTok stories (1080x1920)
          </p>
        </div>
      </div>
    </div>
  );
}
