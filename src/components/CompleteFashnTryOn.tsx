import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Play, Pause, RotateCcw, Download, Share2,
  Layers, Zap, Clock, Database, Trash2, Settings,
  ShirtIcon as Shirt, Package, Sparkles, Crown,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff
} from 'lucide-react';
import completeFashnTryOnService, { ClothingItem, TryOnResult } from '../services/completeFashnTryOnService';

interface CompleteFashnTryOnProps {
  onBack: () => void;
  avatarData?: any;
  clothingItems?: ClothingItem[];
}

interface LayerResult {
  itemId: string;
  itemName: string;
  imageUrl: string;
  layer: number;
  success: boolean;
  error?: string;
}

const CompleteFashnTryOn: React.FC<CompleteFashnTryOnProps> = ({
  onBack,
  avatarData,
  clothingItems = []
}) => {
  // State Management
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [currentView, setCurrentView] = useState<'selection' | 'single' | 'sequential' | 'outfit' | 'cache'>('selection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLayers, setShowLayers] = useState(true);

  // Results State
  const [singleResult, setSingleResult] = useState<TryOnResult | null>(null);
  const [sequentialResults, setSequentialResults] = useState<LayerResult[]>([]);
  const [finalOutfitResult, setFinalOutfitResult] = useState<string | null>(null);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);

  // Processing State
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [fromDatabase, setFromDatabase] = useState(false);

  // Database Stats
  const [cacheStats, setDatabaseStats] = useState(completeFashnTryOnService.getDatabaseStats());

  useEffect(() => {
    // Update cache stats
    const updateStats = () => {
      setDatabaseStats(completeFashnTryOnService.getDatabaseStats());
    };

    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // =====================
  // Item Selection
  // =====================

  const handleItemToggle = (item: ClothingItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const getItemLayer = (clothingType: string): number => {
    const layerMap: { [key: string]: number } = {
      'underwear': 1, 'bra': 1, 'undershirt': 1,
      'shirt': 2, 'blouse': 2, 'top': 2, 'pants': 2, 'jeans': 2, 'shorts': 2, 'skirt': 2, 'dress': 2,
      'jacket': 3, 'coat': 3, 'sweater': 3, 'cardigan': 3, 'hoodie': 3,
      'shoes': 4, 'hat': 4, 'jewelry': 4, 'necklace': 4, 'bag': 4, 'belt': 4
    };
    return layerMap[clothingType.toLowerCase()] || 2;
  };

  const sortedSelectedItems = selectedItems
    .map(item => ({ ...item, layer: getItemLayer(item.clothingType) }))
    .sort((a, b) => a.layer - b.layer);

  // =====================
  // Single Item Try-On
  // =====================

  const handleSingleTryOn = async (item: ClothingItem) => {
    if (!avatarData) return;

    setIsProcessing(true);
    setProcessingStage('Applying single item...');
    setCurrentView('single');

    try {
      const result = await completeFashnTryOnService.tryOnSingleItem(
        avatarData.imageUrl || avatarData,
        item
      );

      setSingleResult(result);
      console.log('Single try-on result:', result);

    } catch (error) {
      console.error('Single try-on failed:', error);
      setSingleResult({
        success: false,
        itemName: item.name,
        itemId: item.id,
        error: error instanceof Error ? error.message : 'Try-on failed'
      });
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // =====================
  // Sequential Layering
  // =====================

  const handleSequentialTryOn = async () => {
    if (!avatarData || selectedItems.length === 0) return;

    setIsProcessing(true);
    setCurrentView('sequential');
    setSequentialResults([]);
    setProcessingProgress(0);

    try {
      setProcessingStage('Starting sequential layering...');

      const result = await completeFashnTryOnService.applyOutfitSequentially(
        avatarData.imageUrl || avatarData,
        selectedItems
      );

      setSequentialResults(result.layerResults);
      setFinalOutfitResult(result.finalImageUrl || null);

      if (result.success) {
        setProcessingStage('Sequential layering completed!');
      } else {
        setProcessingStage('Sequential layering completed with errors');
      }

    } catch (error) {
      console.error('Sequential try-on failed:', error);
      setProcessingStage('Sequential layering failed');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  // =====================
  // Full Outfit Try-On
  // =====================

  const handleFullOutfitTryOn = async () => {
    if (!avatarData || selectedItems.length === 0) return;

    setIsProcessing(true);
    setCurrentView('outfit');
    setProcessingStage('Checking cache...');

    try {
      const result = await completeFashnTryOnService.tryOnFullOutfit(
        avatarData.imageUrl || avatarData,
        selectedItems
      );

      setFinalOutfitResult(result.finalImageUrl || null);
      setFromDatabase(result.fromDatabase);

      if (result.fromDatabase) {
        setProcessingStage('Loaded from cache!');
      } else {
        setProcessingStage('Generated new outfit!');
        setSequentialResults(result.layerResults);
      }

    } catch (error) {
      console.error('Full outfit try-on failed:', error);
      setProcessingStage('Full outfit try-on failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // =====================
  // Database Management
  // =====================

  const handleClearDatabase = () => {
    completeFashnTryOnService.clearDatabase();
    setDatabaseStats(completeFashnTryOnService.getDatabaseStats());
  };

  // =====================
  // UI Helpers
  // =====================

  const getLayerIcon = (layer: number) => {
    switch (layer) {
      case 1: return <Package className="w-4 h-4" />;
      case 2: return <Shirt className="w-4 h-4" />;
      case 3: return <Crown className="w-4 h-4" />;
      case 4: return <Sparkles className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getLayerColor = (layer: number) => {
    switch (layer) {
      case 1: return 'bg-gray-100 text-gray-700';
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-purple-100 text-purple-700';
      case 4: return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLayerName = (layer: number) => {
    switch (layer) {
      case 1: return 'Base';
      case 2: return 'Main';
      case 3: return 'Outer';
      case 4: return 'Accessories';
      default: return 'Layer';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Closet</span>
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Complete FASHN Try-On System</h1>
            <p className="text-gray-600">Advanced layering, accessories, and caching</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Database Stats */}
            <div className="bg-green-100 rounded-lg px-3 py-1">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {cacheStats.outfitCount} outfits, {cacheStats.cacheSize}
                </span>
              </div>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  showLayers
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {showLayers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>Layers</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Item Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Select Items</h3>
              <span className="text-sm text-gray-500">
                {selectedItems.length} selected
              </span>
            </div>

            {/* Layer Guide */}
            {showLayers && (
              <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Layer System</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[1, 2, 3, 4].map(layer => (
                    <div key={layer} className={`flex items-center space-x-1 p-1 rounded ${getLayerColor(layer)}`}>
                      {getLayerIcon(layer)}
                      <span>{getLayerName(layer)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
              {clothingItems.map((item) => {
                const isSelected = selectedItems.some(i => i.id === item.id);
                const itemLayer = getItemLayer(item.clothingType);

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => handleItemToggle(item)}
                      className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Layer indicator */}
                      {showLayers && (
                        <div className={`absolute top-1 left-1 ${getLayerColor(itemLayer)} rounded px-1 py-0.5 text-xs`}>
                          {getLayerName(itemLayer)}
                        </div>
                      )}

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </button>

                    <p className="text-xs text-gray-600 mt-1 truncate">{item.name}</p>

                    {/* Single try-on button */}
                    <button
                      onClick={() => handleSingleTryOn(item)}
                      disabled={!avatarData || isProcessing}
                      className="w-full mt-1 text-xs bg-indigo-100 text-indigo-700 py-1 rounded hover:bg-indigo-200 disabled:opacity-50 transition-colors"
                    >
                      Try Single
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Items ({selectedItems.length})</h4>
                <div className="space-y-1">
                  {sortedSelectedItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${getLayerColor(item.layer)}`}>
                          {getLayerIcon(item.layer)}
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-gray-500">Layer {item.layer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 mt-4">
              <button
                onClick={handleSequentialTryOn}
                disabled={!avatarData || selectedItems.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Sequential Layering</span>
                </div>
              </button>

              <button
                onClick={handleFullOutfitTryOn}
                disabled={!avatarData || selectedItems.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Quick Outfit</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('cache')}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-all"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Database Manager</span>
                </div>
              </button>
            </div>
          </div>

          {/* Center Panel: Avatar Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Avatar</h3>
              {fromDatabase && (
                <div className="flex items-center space-x-1 text-green-600 text-sm">
                  <Database className="w-4 h-4" />
                  <span>From Database</span>
                </div>
              )}
            </div>

            <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden">
              {isProcessing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">{processingStage}</p>
                  {processingProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Display current result based on view */}
                  {currentView === 'single' && singleResult?.finalImageUrl ? (
                    <img
                      src={singleResult.finalImageUrl}
                      alt="Single try-on result"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : currentView === 'sequential' && sequentialResults.length > 0 ? (
                    <img
                      src={sequentialResults[currentLayerIndex]?.imageUrl || (avatarData?.imageUrl || avatarData)}
                      alt="Sequential try-on result"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (currentView === 'outfit' || currentView === 'selection') && finalOutfitResult ? (
                    <img
                      src={finalOutfitResult}
                      alt="Full outfit result"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : avatarData ? (
                    <img
                      src={avatarData.imageUrl || avatarData}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <Crown className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No avatar available</p>
                    </div>
                  )}

                  {/* Layer navigation for sequential view */}
                  {currentView === 'sequential' && sequentialResults.length > 1 && (
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-1">
                      {sequentialResults.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentLayerIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentLayerIndex
                              ? 'bg-white'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {(finalOutfitResult || singleResult?.finalImageUrl) && !isProcessing && (
              <div className="flex space-x-2 mt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <div className="flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </div>
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <div className="flex items-center justify-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Results & Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Results & Details</h3>

            {/* View Tabs */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              {['selection', 'single', 'sequential', 'outfit', 'cache'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view as any)}
                  className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                    currentView === view
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            {/* Content based on current view */}
            <div className="space-y-4">
              {currentView === 'selection' && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Getting Started</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>1. Select clothing items from the left panel</p>
                    <p>2. Items are automatically layered (base → main → outer → accessories)</p>
                    <p>3. Use "Sequential Layering" to see each layer applied</p>
                    <p>4. Use "Quick Outfit" for cached/optimized results</p>
                  </div>
                </div>
              )}

              {currentView === 'single' && singleResult && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Single Item Result</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center space-x-2 ${
                      singleResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {singleResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {singleResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Item:</strong> {singleResult.itemName}</p>
                      {singleResult.processingTime && (
                        <p><strong>Processing Time:</strong> {singleResult.processingTime}ms</p>
                      )}
                      {singleResult.error && (
                        <p className="text-red-600"><strong>Error:</strong> {singleResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'sequential' && sequentialResults.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Layer Results</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sequentialResults.map((result, index) => (
                      <div
                        key={result.itemId}
                        className={`p-2 rounded border-l-4 ${
                          result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                        } ${index === currentLayerIndex ? 'ring-2 ring-purple-500' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${getLayerColor(result.layer)}`}>
                              {getLayerIcon(result.layer)}
                            </div>
                            <span className="text-sm font-medium">{result.itemName}</span>
                          </div>
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'outfit' && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Full Outfit</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {finalOutfitResult ? (
                      <>
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Outfit generated successfully</span>
                        </div>
                        {fromDatabase && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <Database className="w-4 h-4" />
                            <span>Loaded from cache (instant)</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>No outfit result available</p>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'cache' && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Database Management</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-medium text-blue-700">Outfits</div>
                        <div className="text-blue-600">{cacheStats.outfitCount}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium text-green-700">Results</div>
                        <div className="text-green-600">{cacheStats.resultCount}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm text-gray-600">
                        <strong>Database Size:</strong> {cacheStats.cacheSize}
                      </div>
                    </div>

                    <button
                      onClick={handleClearDatabase}
                      className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Database</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteFashnTryOn;