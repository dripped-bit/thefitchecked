import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Download,
  RefreshCw,
  Settings,
  Plus,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  Edit3
} from 'lucide-react';
import { fluxKontextService, AvatarEditPreset, FluxKontextResponse } from '../services/fluxKontextService';

interface AvatarEnhancementProps {
  avatarImageUrl: string;
  onEnhancementComplete: (enhancedImageUrl: string) => void;
  onClose: () => void;
}

interface EnhancementResult {
  id: string;
  preset?: AvatarEditPreset;
  customPrompt?: string;
  result: FluxKontextResponse;
  timestamp: number;
}

const AvatarEnhancement: React.FC<AvatarEnhancementProps> = ({
  avatarImageUrl,
  onEnhancementComplete,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'results'>('presets');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementResults, setEnhancementResults] = useState<EnhancementResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState('');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const presets = fluxKontextService.getAvatarEditPresets();
  const suggestions = fluxKontextService.getSuggestedEnhancements({ qualityScore: 75 });

  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, AvatarEditPreset[]>);

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev =>
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const handlePresetEnhancement = async () => {
    if (selectedPresets.length === 0) return;

    setIsProcessing(true);
    setActiveTab('results');
    setProcessingProgress('Preparing enhancements...');

    try {
      const results: EnhancementResult[] = [];

      for (let i = 0; i < selectedPresets.length; i++) {
        const presetId = selectedPresets[i];
        const preset = presets.find(p => p.id === presetId);
        if (!preset) continue;

        setProcessingProgress(`Applying ${preset.name} (${i + 1}/${selectedPresets.length})...`);

        const result = await fluxKontextService.applyPresetEnhancement(
          avatarImageUrl,
          presetId
        );

        results.push({
          id: `preset_${presetId}_${Date.now()}`,
          preset,
          result,
          timestamp: Date.now()
        });

        // Small delay between requests to avoid rate limiting
        if (i < selectedPresets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setEnhancementResults(prev => [...prev, ...results]);
      setSelectedPresets([]);
    } catch (error) {
      console.error('Preset enhancement failed:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  const handleCustomEnhancement = async () => {
    if (!customPrompt.trim()) return;

    setIsProcessing(true);
    setActiveTab('results');
    setProcessingProgress('Processing custom enhancement...');

    try {
      const result = await fluxKontextService.customEdit(
        avatarImageUrl,
        customPrompt.trim()
      );

      const enhancementResult: EnhancementResult = {
        id: `custom_${Date.now()}`,
        customPrompt: customPrompt.trim(),
        result,
        timestamp: Date.now()
      };

      setEnhancementResults(prev => [...prev, enhancementResult]);
      setCustomPrompt('');
    } catch (error) {
      console.error('Custom enhancement failed:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  };

  const handleUseResult = (resultId: string) => {
    const result = enhancementResults.find(r => r.id === resultId);
    if (result && result.result.images.length > 0) {
      onEnhancementComplete(result.result.images[0].url);
    }
  };

  const renderPresetTab = () => (
    <div className="space-y-6">
      {/* Suggested Enhancements */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span>Suggested for You</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map(preset => (
              <button
                key={preset.id}
                onClick={() => togglePreset(preset.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedPresets.includes(preset.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                <p className="text-xs text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Presets by Category */}
      {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3 capitalize flex items-center space-x-2">
            <span>{category} Enhancements</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categoryPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => togglePreset(preset.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                  selectedPresets.includes(preset.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-medium text-sm">{preset.name}</span>
                  {selectedPresets.includes(preset.id) && (
                    <Check className="w-4 h-4 text-purple-500 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Apply Button */}
      {selectedPresets.length > 0 && (
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
          <button
            onClick={handlePresetEnhancement}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Wand2 className="w-5 h-5" />
            <span>Apply {selectedPresets.length} Enhancement{selectedPresets.length > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderCustomTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <Edit3 className="w-5 h-5 text-blue-500" />
          <span>Custom Enhancement</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe how you want to enhance your avatar. Be specific about changes to style, clothing, background, or pose.
        </p>

        <div className="space-y-4">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Add sunglasses and a leather jacket, change background to a city skyline, make the pose more confident..."
            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
          />

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium mb-2">💡 Enhancement Tips:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Be specific about what you want to change</li>
              <li>• Mention style, clothing, background, or pose adjustments</li>
              <li>• Use descriptive language for better results</li>
              <li>• Example: "Add professional business attire and office background"</li>
            </ul>
          </div>

          <button
            onClick={handleCustomEnhancement}
            disabled={!customPrompt.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Custom Enhancement</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-green-500" />
          <span>Enhancement Results</span>
        </h3>
        {enhancementResults.length > 0 && (
          <span className="text-sm text-gray-600">
            {enhancementResults.length} result{enhancementResults.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isProcessing && (
        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="font-medium text-blue-800">{processingProgress}</p>
          <p className="text-sm text-blue-600 mt-1">This may take a few moments...</p>
        </div>
      )}

      {enhancementResults.length === 0 && !isProcessing && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No enhancements yet</p>
          <p className="text-sm text-gray-500">Try some presets or create a custom enhancement</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {enhancementResults.map(result => (
          <div key={result.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">
                    {result.preset ? result.preset.name : 'Custom Enhancement'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {result.preset ? result.preset.description : result.customPrompt}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {result.result.images.length > 0 && (
                <div className="space-y-3">
                  <img
                    src={result.result.images[0].url}
                    alt="Enhanced avatar"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUseResult(result.id)}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Use This</span>
                    </button>

                    <button
                      onClick={() => window.open(result.result.images[0].url, '_blank')}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Enhance Your Avatar
            </h2>
            <p className="text-gray-600">Use AI to transform and improve your 3D avatar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'presets', label: 'Quick Presets', icon: Wand2 },
            { id: 'custom', label: 'Custom Edit', icon: Edit3 },
            { id: 'results', label: 'Results', icon: ImageIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.id === 'results' && enhancementResults.length > 0 && (
                <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {enhancementResults.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'presets' && renderPresetTab()}
          {activeTab === 'custom' && renderCustomTab()}
          {activeTab === 'results' && renderResultsTab()}
        </div>
      </div>
    </div>
  );
};

export default AvatarEnhancement;