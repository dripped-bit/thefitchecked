import { useState, useEffect } from 'react';
import outfitStorageService from '../services/outfitStorageService';
import userDataService from '../services/userDataService';

export default function MyOutfitsPage() {
  const [outfits, setOutfits] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterColor, setFilterColor] = useState('');

  useEffect(() => {
    loadOutfits();
  }, []);

  async function loadOutfits() {
    setLoading(true);
    try {
      const userData = userDataService.getAllUserData();
      const userId = userData?.profile?.email || 'anonymous';
      setUser({ id: userId });

      const data = await outfitStorageService.getUserOutfits(userId);
      setOutfits(data || []);
    } catch (error) {
      console.error('Error loading outfits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite(outfitId, currentFavorited) {
    const success = await outfitStorageService.toggleFavorite(outfitId, !currentFavorited);
    if (success) {
      setOutfits(outfits.map(o =>
        o.id === outfitId ? { ...o, favorited: !currentFavorited } : o
      ));
    }
  }

  async function handleRate(outfitId, rating) {
    const success = await outfitStorageService.rateOutfit(outfitId, rating, user?.id);
    if (success) {
      setOutfits(outfits.map(o =>
        o.id === outfitId ? { ...o, rating } : o
      ));
    }
  }

  async function handleShare(outfitId) {
    const url = await outfitStorageService.shareOutfit(outfitId);
    if (url) {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    }
  }

  const filteredOutfits = filterColor
    ? outfits.filter(o => o.primary_colors?.includes(filterColor))
    : outfits;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
        <p className="mt-4 text-gray-600">Loading your outfits...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Outfits</h1>

      {/* Color Filter */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by color (e.g., #FF0000 or red)..."
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Outfit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOutfits.map((outfit) => (
          <div key={outfit.id} className="border rounded-lg p-4 bg-white shadow-md hover:shadow-xl transition-shadow">
            {/* Image */}
            <img
              src={outfit.image_url}
              alt={outfit.occasion}
              className="w-full h-64 object-cover rounded mb-4"
            />

            {/* Info */}
            <h3 className="font-bold text-lg">{outfit.occasion}</h3>
            <p className="text-sm text-gray-600 mb-2 capitalize">{outfit.style} style</p>

            {/* Colors */}
            {outfit.primary_colors && outfit.primary_colors.length > 0 && (
              <div className="flex gap-2 mb-4">
                {outfit.primary_colors.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-3">
              {/* Favorite */}
              <button
                onClick={() => handleFavorite(outfit.id, outfit.favorited)}
                className="text-2xl hover:scale-110 transition-transform"
                aria-label={outfit.favorited ? 'Unfavorite' : 'Favorite'}
              >
                {outfit.favorited ? '❤️' : '🤍'}
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(outfit.id)}
                className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
              >
                🔗 Share
              </button>
            </div>

            {/* Rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(outfit.id, star)}
                  className={`text-xl transition-transform hover:scale-110 ${
                    star <= (outfit.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  aria-label={`Rate ${star} stars`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredOutfits.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <p className="text-lg">No outfits found.</p>
          <p className="text-sm mt-2">Generate your first outfit to get started!</p>
        </div>
      )}
    </div>
  );
}
