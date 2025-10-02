import React, { useState, useRef, DragEvent, useEffect } from 'react';
import {
  ArrowLeft, Save, Share2, Play, Shuffle, Heart, Star,
  Trash2, Copy, Download, Palette, Sparkles, Award,
  Crown, Target, Users, TrendingUp, Calendar, MapPin,
  Sun, Cloud, Snowflake, Leaf, Zap
} from 'lucide-react';
import { ClothingCategory } from '../services/closetService';
import useDevMode from '../hooks/useDevMode';

interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  category: ClothingCategory;
  color?: string;
  brand?: string;
  price?: number;
  sustainability?: 'eco' | 'regular' | 'fast-fashion';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
}

interface OutfitSlot {
  id: string;
  category: ClothingCategory;
  name: string;
  item?: ClothingItem;
  required: boolean;
}

interface OutfitCombination {
  id: string;
  name: string;
  items: ClothingItem[];
  occasion: string;
  season: string;
  rating?: number;
  saves: number;
  dateCreated: string;
  tags: string[];
}

interface OutfitCreatorProps {
  clothingItems: ClothingItem[];
  onBack: () => void;
  avatarData?: any;
  onTryOn?: (outfit: ClothingItem[]) => void;
}

const OutfitCreator: React.FC<OutfitCreatorProps> = ({
  clothingItems,
  onBack,
  avatarData,
  onTryOn
}) => {
  // Outfit building state
  const [outfitSlots, setOutfitSlots] = useState<OutfitSlot[]>([
    { id: 'top', category: 'shirts', name: 'Top', required: true },
    { id: 'bottom', category: 'pants', name: 'Bottom', required: true },
    { id: 'shoes', category: 'shoes', name: 'Shoes', required: false },
    { id: 'accessories', category: 'accessories', name: 'Accessories', required: false },
    { id: 'outerwear', category: 'shirts', name: 'Outerwear', required: false }
  ]);

  const [currentOutfit, setCurrentOutfit] = useState<ClothingItem[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [selectedSeason, setSelectedSeason] = useState('fall');
  const [outfitTags, setOutfitTags] = useState<string[]>([]);

  // UI state
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<OutfitCombination[]>([]);

  // Analytics state
  const [outfitScore, setOutfitScore] = useState(0);
  const [sustainability, setSustainability] = useState(0);

  // Dev mode support for auto-filling outfit names
  useDevMode({
    onOutfitName: (demoData) => {
      setOutfitName(demoData || 'Weekend Wanderer');
    }
  });
  const [colorHarmony, setColorHarmony] = useState(0);
  const [seasonAppropriate, setSeasonAppropriate] = useState(0);

  const occasions = [
    { id: 'casual', name: 'Casual', icon: <Target className="w-4 h-4" /> },
    { id: 'work', name: 'Work', icon: <MapPin className="w-4 h-4" /> },
    { id: 'date', name: 'Date Night', icon: <Heart className="w-4 h-4" /> },
    { id: 'party', name: 'Party', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'workout', name: 'Workout', icon: <Zap className="w-4 h-4" /> },
    { id: 'formal', name: 'Formal', icon: <Crown className="w-4 h-4" /> }
  ];

  const seasons = [
    { id: 'spring', name: 'Spring', icon: <Leaf className="w-4 h-4" />, color: 'text-green-600' },
    { id: 'summer', name: 'Summer', icon: <Sun className="w-4 h-4" />, color: 'text-yellow-600' },
    { id: 'fall', name: 'Fall', icon: <Cloud className="w-4 h-4" />, color: 'text-orange-600' },
    { id: 'winter', name: 'Winter', icon: <Snowflake className="w-4 h-4" />, color: 'text-blue-600' }
  ];

  const availableTags = [
    'Comfortable', 'Stylish', 'Professional', 'Trendy', 'Classic',
    'Edgy', 'Minimalist', 'Boho', 'Athletic', 'Elegant',
    'Vintage', 'Modern', 'Chic', 'Cute', 'Bold'
  ];

  // Calculate outfit analytics
  useEffect(() => {
    calculateOutfitScore();
  }, [currentOutfit, selectedOccasion, selectedSeason]);

  const calculateOutfitScore = () => {
    if (currentOutfit.length === 0) {
      setOutfitScore(0);
      setSustainability(0);
      setColorHarmony(0);
      setSeasonAppropriate(0);
      return;
    }

    // Sustainability score
    const ecoItems = currentOutfit.filter(item => item.sustainability === 'eco').length;
    const sustainabilityScore = Math.round((ecoItems / currentOutfit.length) * 100);

    // Season appropriateness
    const seasonItems = currentOutfit.filter(
      item => item.season === selectedSeason || item.season === 'all'
    ).length;
    const seasonScore = Math.round((seasonItems / currentOutfit.length) * 100);

    // Color harmony (simplified)
    const colors = currentOutfit.map(item => item.color).filter(Boolean);
    const colorScore = colors.length > 0 ? 75 + Math.random() * 25 : 0; // Mock calculation

    // Overall score
    const overall = Math.round((sustainabilityScore + seasonScore + colorScore) / 3);

    setSustainability(sustainabilityScore);
    setSeasonAppropriate(seasonScore);
    setColorHarmony(Math.round(colorScore));
    setOutfitScore(overall);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: ClothingItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotId);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, slotId: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (draggedItem) {
      const slot = outfitSlots.find(s => s.id === slotId);
      if (slot && (slot.category === draggedItem.category || slot.category === 'accessories')) {
        // Remove item from other slots first
        const updatedOutfit = currentOutfit.filter(item => item.id !== draggedItem.id);

        // Add to new slot
        setCurrentOutfit([...updatedOutfit, draggedItem]);

        // Update slot
        setOutfitSlots(prev => prev.map(s =>
          s.id === slotId ? { ...s, item: draggedItem } :
          s.item?.id === draggedItem.id ? { ...s, item: undefined } : s
        ));
      }
    }

    setDraggedItem(null);
  };

  const removeFromSlot = (slotId: string) => {
    const slot = outfitSlots.find(s => s.id === slotId);
    if (slot?.item) {
      setCurrentOutfit(prev => prev.filter(item => item.id !== slot.item!.id));
      setOutfitSlots(prev => prev.map(s =>
        s.id === slotId ? { ...s, item: undefined } : s
      ));
    }
  };

  const generateRandomOutfit = async () => {
    setIsGeneratingSuggestion(true);

    // Simple algorithm to create a balanced outfit
    const availableItems = clothingItems.filter(item =>
      item.season === selectedSeason || item.season === 'all'
    );

    const newOutfit: ClothingItem[] = [];
    const newSlots = [...outfitSlots];

    // Try to fill required slots first
    for (const slot of newSlots) {
      const categoryItems = availableItems.filter(item =>
        item.category === slot.category &&
        !newOutfit.find(existing => existing.id === item.id)
      );

      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        newOutfit.push(randomItem);
        slot.item = randomItem;
      }
    }

    setTimeout(() => {
      setCurrentOutfit(newOutfit);
      setOutfitSlots(newSlots);
      setIsGeneratingSuggestion(false);
    }, 1500);
  };

  const saveOutfit = () => {
    if (currentOutfit.length === 0 || !outfitName.trim()) return;

    const newOutfit: OutfitCombination = {
      id: Date.now().toString(),
      name: outfitName,
      items: [...currentOutfit],
      occasion: selectedOccasion,
      season: selectedSeason,
      rating: outfitScore / 20, // Convert to 5-star scale
      saves: 0,
      dateCreated: new Date().toISOString(),
      tags: [...outfitTags]
    };

    setSavedOutfits(prev => [...prev, newOutfit]);
    setShowSaveModal(false);
    setOutfitName('');
    setOutfitTags([]);

    // Reset outfit
    setCurrentOutfit([]);
    setOutfitSlots(prev => prev.map(slot => ({ ...slot, item: undefined })));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredItems = clothingItems.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Closet</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-800">Outfit Creator</h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={currentOutfit.length === 0}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Outfit</span>
            </button>

            {onTryOn && (
              <button
                onClick={() => onTryOn(currentOutfit)}
                disabled={currentOutfit.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Try On Avatar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Clothing Items */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Clothing Items</h3>

            {/* Category Filter */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['all', 'shirts', 'pants', 'dresses', 'shoes', 'accessories'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="drag-item bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-grab"
                >
                  <div className="aspect-square relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.sustainability === 'eco' && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                        <Leaf className="w-2 h-2" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Outfit Builder */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Outfit Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Outfit Settings</h3>
              <button
                onClick={generateRandomOutfit}
                disabled={isGeneratingSuggestion}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
              >
                <Shuffle className={`w-4 h-4 ${isGeneratingSuggestion ? 'animate-spin' : ''}`} />
                <span>{isGeneratingSuggestion ? 'Generating...' : 'Generate Outfit'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
                <div className="grid grid-cols-2 gap-2">
                  {occasions.map((occasion) => (
                    <button
                      key={occasion.id}
                      onClick={() => setSelectedOccasion(occasion.id)}
                      className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                        selectedOccasion === occasion.id
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {occasion.icon}
                      <span>{occasion.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                <div className="grid grid-cols-2 gap-2">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeason(season.id)}
                      className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                        selectedSeason === season.id
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={season.color}>{season.icon}</span>
                      <span>{season.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Outfit Slots */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Build Your Outfit</h3>

            <div className="grid grid-cols-5 gap-4">
              {outfitSlots.map((slot) => (
                <div
                  key={slot.id}
                  onDragOver={(e) => handleDragOver(e, slot.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slot.id)}
                  className={`drop-zone aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    dragOverSlot === slot.id ? 'drag-over' : 'border-gray-300'
                  } ${slot.item ? 'border-purple-400 bg-purple-50' : slot.required ? 'bg-red-50' : 'bg-gray-50'}`}
                >
                  {slot.item ? (
                    <>
                      <img
                        src={slot.item.imageUrl}
                        alt={slot.item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFromSlot(slot.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className={`text-center ${slot.required ? 'outfit-slot-empty' : ''}`}>
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Target className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">{slot.name}</p>
                      {slot.required && (
                        <p className="text-xs text-red-500 mt-1">Required</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Outfit Analytics */}
          {currentOutfit.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Outfit Analysis</h3>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold rounded-lg px-3 py-2 ${getScoreColor(outfitScore)}`}>
                    {outfitScore}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Overall Score</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold rounded-lg px-3 py-2 ${getScoreColor(sustainability)}`}>
                    {sustainability}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Sustainability</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold rounded-lg px-3 py-2 ${getScoreColor(colorHarmony)}`}>
                    {colorHarmony}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Color Harmony</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold rounded-lg px-3 py-2 ${getScoreColor(seasonAppropriate)}`}>
                    {seasonAppropriate}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Season Match</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Saved Outfits */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-3">Saved Outfits</h3>

          {savedOutfits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No saved outfits yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedOutfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{outfit.name}</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(outfit.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex -space-x-2 mb-2">
                    {outfit.items.slice(0, 3).map((item, index) => (
                      <img
                        key={item.id}
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        style={{ zIndex: 3 - index }}
                      />
                    ))}
                    {outfit.items.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{outfit.items.length - 3}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{outfit.occasion}</span>
                    <span className="capitalize">{outfit.season}</span>
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <button className="flex-1 bg-purple-600 text-white py-1 px-2 rounded text-xs hover:bg-purple-700 transition-colors">
                      Load
                    </button>
                    <button className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors">
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Outfit Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Outfit</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outfit Name</label>
                <input
                  type="text"
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  placeholder="Give your outfit a name..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (outfitTags.includes(tag)) {
                          setOutfitTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setOutfitTags(prev => [...prev, tag]);
                        }
                      }}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${
                        outfitTags.includes(tag)
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveOutfit}
                disabled={!outfitName.trim()}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Outfit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitCreator;