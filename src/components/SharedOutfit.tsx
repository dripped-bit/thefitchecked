/**
 * Shared Outfit Component
 * Displays shared outfit when user visits a share link
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Thermometer,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import shareService, { SharedOutfitData } from '../services/shareService';

interface SharedOutfitProps {
  shareId: string;
  onCreateOwn?: () => void;
}

export const SharedOutfit: React.FC<SharedOutfitProps> = ({ shareId, onCreateOwn }) => {
  const [outfit, setOutfit] = useState<SharedOutfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSharedOutfit();
  }, [shareId]);

  const loadSharedOutfit = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await shareService.getSharedOutfit(shareId);

      if (!data) {
        setError('Outfit not found');
        return;
      }

      if (!data.privacy.allowSharing) {
        setError('This outfit is no longer available for sharing');
        return;
      }

      setOutfit(data);
    } catch (err) {
      console.error('Failed to load shared outfit:', err);
      setError('Failed to load outfit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Outfit...</h3>
          <p className="text-gray-600">Just a moment</p>
        </div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Outfit Not Available</h3>
          <p className="text-gray-600 mb-6">{error || 'This outfit could not be found'}</p>
          {onCreateOwn && (
            <button
              onClick={onCreateOwn}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <span>Create Your Own Outfit</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Determine which image to show based on privacy settings
  const displayImage = outfit.privacy.outfitOnly
    ? outfit.outfitImageUrl || outfit.avatarImageUrl
    : outfit.avatarImageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Check Out This Outfit!
          </h1>
          <p className="text-gray-600">Shared from FitChecked</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Outfit Image */}
          <div className="relative bg-gray-100">
            <img
              src={displayImage}
              alt={outfit.outfitDetails.occasion || 'Shared outfit'}
              className="w-full h-auto object-contain max-h-[600px] mx-auto"
            />
          </div>

          {/* Outfit Details */}
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {outfit.outfitDetails.occasion || outfit.outfitDetails.description}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {outfit.outfitDetails.formality && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Style</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {outfit.outfitDetails.formality} Attire
                    </p>
                  </div>
                </div>
              )}

              {outfit.outfitDetails.weather && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weather</p>
                    <p className="font-semibold text-gray-900">{outfit.outfitDetails.weather}</p>
                  </div>
                </div>
              )}

              {outfit.outfitDetails.date && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">When</p>
                    <p className="font-semibold text-gray-900">
                      {outfit.outfitDetails.date}
                      {outfit.outfitDetails.time && ` ${outfit.outfitDetails.time}`}
                    </p>
                  </div>
                </div>
              )}

              {outfit.outfitDetails.location && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{outfit.outfitDetails.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Links */}
            {outfit.shoppingLinks && outfit.shoppingLinks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>Shop This Look</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {outfit.shoppingLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{link.name}</p>
                        {link.price && (
                          <p className="text-sm text-gray-600">{link.price}</p>
                        )}
                        {link.store && (
                          <p className="text-xs text-gray-500">{link.store}</p>
                        )}
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white text-center">
              <h3 className="text-xl font-bold mb-2">Love This Look?</h3>
              <p className="mb-4 text-purple-100">
                Create your own personalized outfits with FitChecked
              </p>
              {onCreateOwn && (
                <button
                  onClick={onCreateOwn}
                  className="inline-flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Create Your Avatar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Generated By Badge */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Generated with{' '}
                <span className="font-semibold text-purple-600">FitChecked</span>
                {outfit.generatedBy && (
                  <> via {outfit.generatedBy.replace('-', ' ')}</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedOutfit;
