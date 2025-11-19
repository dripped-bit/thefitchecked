import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Search, Sparkles, Calendar } from 'lucide-react';
import outfitStorageService, { OutfitData } from '../services/outfitStorageService';
import authService from '../services/authService';
import { IOSNavigationBar, IOSBackButton } from '../components/ui/IOSNavigationBar';

interface MyCreationsPageProps {
  onBack?: () => void;
}

/**
 * My Creations Page
 * Displays AI-generated outfits that the user tried on their avatar
 * Shows the try-on result image with the original prompt they used
 */
export default function MyCreationsPage({ onBack }: MyCreationsPageProps) {
  const [creations, setCreations] = useState<OutfitData[]>([]);
  const [filteredCreations, setFilteredCreations] = useState<OutfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadCreations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [creations, searchQuery, filterMode]);

  const loadCreations = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      const data = await outfitStorageService.getCreations(user.id);
      setCreations(data);
    } catch (error) {
      console.error('Error loading creations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...creations];

    // Apply favorites filter
    if (filterMode === 'favorites') {
      filtered = filtered.filter(c => c.favorited);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.generation_prompt?.toLowerCase().includes(query) ||
        c.occasion?.toLowerCase().includes(query) ||
        c.style?.toLowerCase().includes(query)
      );
    }

    setFilteredCreations(filtered);
  };

  const handleToggleFavorite = async (creationId: string, currentStatus: boolean) => {
    try {
      await outfitStorageService.toggleFavorite(creationId, !currentStatus);
      // Update local state
      setCreations(prev =>
        prev.map(c => c.id === creationId ? { ...c, favorited: !currentStatus } : c)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (creationId: string) => {
    if (!confirm('Are you sure you want to delete this creation?')) {
      return;
    }

    try {
      await outfitStorageService.deleteOutfit(creationId);
      // Update local state
      setCreations(prev => prev.filter(c => c.id !== creationId));
    } catch (error) {
      console.error('Error deleting creation:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-[calc(49px+env(safe-area-inset-bottom))] pt-safe relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: "url('/avatarhomepage.png')" }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* iOS Navigation Bar */}
        <IOSNavigationBar
          title="My Creations"
          subtitle={`${filteredCreations.length} ${filteredCreations.length === 1 ? 'outfit' : 'outfits'}`}
          large={true}
          leftItems={onBack && <IOSBackButton label="Home" onClick={onBack} />}
        />

        {/* Search and Filter Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Search and Filter Bar */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by prompt, occasion, or style..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterMode === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All ({creations.length})
                </button>
                <button
                  onClick={() => setFilterMode('favorites')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterMode === 'favorites'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-4 h-4 inline mr-1" />
                  Favorites ({creations.filter(c => c.favorited).length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredCreations.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="ios-title-3 text-gray-700 mb-2">
                {searchQuery || filterMode === 'favorites'
                  ? 'No creations found'
                  : 'No creations yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterMode === 'favorites'
                  ? 'Try adjusting your search or filters'
                  : 'Generate an outfit and try it on your avatar to create your first creation!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreations.map((creation) => (
                <div
                  key={creation.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <img
                      src={creation.image_url}
                      alt={creation.generation_prompt || 'Creation'}
                      className="w-full h-full object-cover"
                    />
                    {/* Favorite Button */}
                    <button
                      onClick={() => handleToggleFavorite(creation.id!, creation.favorited)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          creation.favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Generation Prompt */}
                    <div className="mb-3">
                      <p className="ios-callout font-medium text-gray-900 mb-1">
                        "{creation.generation_prompt || 'No prompt available'}"
                      </p>
                    </div>

                    {/* Occasion Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full ios-caption-1 font-medium bg-purple-100 text-purple-800">
                        <Calendar className="w-3 h-3 mr-1" />
                        {creation.occasion}
                      </span>
                      {creation.style && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full ios-caption-1 font-medium bg-blue-100 text-blue-800">
                          {creation.style}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="ios-caption-1 text-gray-500 mb-3">
                      Created {formatDate(creation.created_at)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(creation.id!)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ios-callout font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Help Text */}
        {!loading && filteredCreations.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="ios-headline mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                About Your Creations
              </h3>
              <ul className="space-y-2 ios-subheadline text-gray-600">
                <li>• These are AI-generated outfits you tried on your avatar</li>
                <li>• Each creation shows your original prompt and the try-on result</li>
                <li>• Click the <Heart className="w-4 h-4 inline text-red-500" /> to favorite your best looks</li>
                <li>• Use the search bar to find creations by prompt, occasion, or style</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
