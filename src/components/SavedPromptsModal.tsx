/**
 * Saved Prompts Modal
 * View, save, and load avatar generation prompts
 */

import React, { useState, useEffect } from 'react';
import { X, Star, Copy, Trash2, Download, Upload, BookOpen } from 'lucide-react';
import savedPromptsService, { SavedAvatarPrompt } from '../services/savedPromptsService';
import { CURRENT_PERFECT_PROMPT } from '../config/bestavatargenerated.js';

interface SavedPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPromptData?: {
    prompt: string;
    negativePrompt: string;
    parameters: any;
    quality: 'FAST' | 'OPTIMAL' | 'ULTRA';
  };
  onLoadPrompt?: (prompt: SavedAvatarPrompt) => void;
}

const SavedPromptsModal: React.FC<SavedPromptsModalProps> = ({
  isOpen,
  onClose,
  currentPromptData,
  onLoadPrompt
}) => {
  const [savedPrompts, setSavedPrompts] = useState<SavedAvatarPrompt[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptNotes, setNewPromptNotes] = useState('');
  const [newPromptRating, setNewPromptRating] = useState<number>(5);
  const [selectedTab, setSelectedTab] = useState<'saved' | 'current'>('current');

  useEffect(() => {
    if (isOpen) {
      loadSavedPrompts();
    }
  }, [isOpen]);

  const loadSavedPrompts = () => {
    const prompts = savedPromptsService.getAllPrompts();
    setSavedPrompts(prompts);
  };

  const handleSaveCurrentPrompt = () => {
    if (!currentPromptData) {
      alert('No current prompt data available');
      return;
    }

    if (!newPromptName.trim()) {
      alert('Please enter a name for this prompt');
      return;
    }

    savedPromptsService.savePrompt({
      name: newPromptName,
      prompt: currentPromptData.prompt,
      negativePrompt: currentPromptData.negativePrompt,
      parameters: currentPromptData.parameters,
      quality: currentPromptData.quality,
      notes: newPromptNotes,
      rating: newPromptRating
    });

    setShowSaveDialog(false);
    setNewPromptName('');
    setNewPromptNotes('');
    setNewPromptRating(5);
    loadSavedPrompts();
    alert('Prompt saved successfully!');
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      savedPromptsService.deletePrompt(id);
      loadSavedPrompts();
    }
  };

  const handleLoadPrompt = (prompt: SavedAvatarPrompt) => {
    if (onLoadPrompt) {
      onLoadPrompt(prompt);
      alert(`Loaded prompt: ${prompt.name}`);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Prompt copied to clipboard!');
  };

  const handleExport = () => {
    const exportData = savedPromptsService.exportPrompts();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avatar-prompts-${Date.now()}.json`;
    a.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (savedPromptsService.importPrompts(content)) {
        loadSavedPrompts();
        alert('Prompts imported successfully!');
      } else {
        alert('Failed to import prompts. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Avatar Prompts Manager</h2>
            <p className="text-gray-600 mt-1">Save and manage your best avatar generation prompts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab('current')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              selectedTab === 'current'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Current Best Prompt
          </button>
          <button
            onClick={() => setSelectedTab('saved')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              selectedTab === 'saved'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Saved Prompts ({savedPrompts.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'current' && (
            <div>
              {/* Current Perfect Prompt */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{CURRENT_PERFECT_PROMPT.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Quality: {CURRENT_PERFECT_PROMPT.quality} | Rating: {CURRENT_PERFECT_PROMPT.rating} ★</p>
                  </div>
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save This Prompt
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Positive Prompt:</label>
                    <div className="bg-white rounded-lg p-4 text-sm text-gray-800 border">
                      {CURRENT_PERFECT_PROMPT.prompt}
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(CURRENT_PERFECT_PROMPT.prompt)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Negative Prompt:</label>
                    <div className="bg-white rounded-lg p-4 text-sm text-gray-800 border max-h-32 overflow-y-auto">
                      {CURRENT_PERFECT_PROMPT.negativePrompt}
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(CURRENT_PERFECT_PROMPT.negativePrompt)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parameters:</label>
                    <div className="bg-white rounded-lg p-4 text-sm text-gray-800 border">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(CURRENT_PERFECT_PROMPT.parameters, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                    <div className="bg-white rounded-lg p-4 text-sm text-gray-800 border">
                      {CURRENT_PERFECT_PROMPT.notes}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="mt-6 bg-white rounded-xl p-6 border-2 border-purple-300">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Save Current Prompt</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Name *</label>
                      <input
                        type="text"
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                        placeholder="e.g., Perfect Full Body Avatar v2"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                      <textarea
                        value={newPromptNotes}
                        onChange={(e) => setNewPromptNotes(e.target.value)}
                        placeholder="What made this prompt successful? When to use it?"
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setNewPromptRating(rating)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                rating <= newPromptRating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveCurrentPrompt}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Save Prompt
                      </button>
                      <button
                        onClick={() => setShowSaveDialog(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'saved' && (
            <div>
              {/* Export/Import */}
              <div className="flex justify-end space-x-2 mb-4">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <label className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Saved Prompts List */}
              {savedPrompts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Prompts Yet</h3>
                  <p className="text-gray-600">
                    Go to the "Current Best Prompt" tab to save your first prompt!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-gray-50 rounded-xl p-4 border hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{prompt.name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(prompt.timestamp).toLocaleDateString()} | {prompt.quality}
                            {prompt.rating && (
                              <span className="ml-2">
                                {Array.from({ length: prompt.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 inline text-yellow-400 fill-current" />
                                ))}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {onLoadPrompt && (
                            <button
                              onClick={() => handleLoadPrompt(prompt)}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Load
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyPrompt(prompt.prompt)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="p-2 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {prompt.notes && (
                        <p className="text-sm text-gray-700 mb-2 italic">"{prompt.notes}"</p>
                      )}

                      <details className="text-sm">
                        <summary className="cursor-pointer text-purple-600 hover:text-purple-800">
                          View Full Prompt
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded border text-gray-800">
                          {prompt.prompt}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {savedPrompts.length} saved prompts
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedPromptsModal;
