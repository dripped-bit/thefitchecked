/**
 * Developer Prompt Debug Panel
 * Draggable panel showing prompts used for avatar and outfit generation
 * Access: Ctrl+Shift+D (Cmd+Shift+D on Mac)
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Copy, Download, Trash2, Terminal, Database } from 'lucide-react';
import promptDebugService, { PromptDebugEntry } from '../services/promptDebugService';
import { clearAppCacheWithConfirmation } from '../utils/clearCache';

interface DevPromptPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DevPromptPanel: React.FC<DevPromptPanelProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'avatar' | 'outfit'>('avatar');
  const [entries, setEntries] = useState<PromptDebugEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 520, y: window.innerHeight - 620 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Load initial entries
      loadEntries();

      // Subscribe to updates
      const unsubscribe = promptDebugService.subscribe((newEntries) => {
        setEntries(newEntries);
      });

      return () => unsubscribe();
    }
  }, [isOpen]);

  const loadEntries = () => {
    const allEntries = promptDebugService.getAllEntries();
    setEntries(allEntries);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 500, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('📋 [DEV-PANEL] Copied to clipboard');
  };

  const handleExport = () => {
    const exportData = promptDebugService.exportEntries();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-debug-logs-${Date.now()}.json`;
    a.click();
    console.log('💾 [DEV-PANEL] Exported logs');
  };

  const handleClear = () => {
    if (confirm('Clear all debug logs?')) {
      promptDebugService.clearAllEntries();
      setEntries([]);
    }
  };

  const filteredEntries = entries.filter(entry => entry.type === selectedTab);
  const stats = promptDebugService.getStats();

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl border-2 border-purple-500"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : '500px',
        height: isMinimized ? '50px' : '600px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header - Draggable */}
      <div
        className="drag-handle flex items-center justify-between p-3 bg-purple-600 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4" />
          <span className="font-bold text-sm">Prompt Debug Panel</span>
          <span className="text-xs opacity-75">
            ({stats.avatar} avatar, {stats.outfit} outfit)
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-purple-700 rounded transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-purple-700 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setSelectedTab('avatar')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'avatar'
                  ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Avatar Prompts ({stats.avatar})
            </button>
            <button
              onClick={() => setSelectedTab('outfit')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === 'outfit'
                  ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Outfit Prompts ({stats.outfit})
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="text-xs text-gray-400">
              {filteredEntries.length} entries
            </div>
            <div className="flex space-x-1">
              <button
                onClick={clearAppCacheWithConfirmation}
                className="p-1.5 hover:bg-orange-700 rounded transition-colors"
                title="Clear ALL app data (cache, localStorage, IndexedDB)"
              >
                <Database className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Export logs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 hover:bg-red-700 rounded transition-colors"
                title="Clear prompt logs only"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Entries List */}
          <div className="overflow-y-auto" style={{ height: 'calc(600px - 130px)' }}>
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Terminal className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No {selectedTab} prompts logged yet</p>
                <p className="text-xs mt-1">Generate an {selectedTab} to see prompts here</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-purple-500 transition-colors"
                  >
                    {/* Entry Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-purple-400">{entry.serviceName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(entry.prompt)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy prompt"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Prompt */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-400 mb-1">Positive Prompt:</div>
                      <div className="text-xs text-white bg-gray-900 rounded p-2 max-h-32 overflow-y-auto font-mono">
                        {entry.prompt}
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    {entry.negativePrompt && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-400 mb-1">Negative Prompt:</div>
                        <div className="text-xs text-white bg-gray-900 rounded p-2 max-h-24 overflow-y-auto font-mono">
                          {entry.negativePrompt}
                        </div>
                      </div>
                    )}

                    {/* Parameters */}
                    {entry.parameters && Object.keys(entry.parameters).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                          Parameters
                        </summary>
                        <div className="mt-1 bg-gray-900 rounded p-2">
                          <pre className="text-xs text-white font-mono overflow-x-auto">
                            {JSON.stringify(entry.parameters, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}

                    {/* Metadata */}
                    {entry.metadata && (
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                        {entry.metadata.success !== undefined && (
                          <span className={entry.metadata.success ? 'text-green-400' : 'text-red-400'}>
                            {entry.metadata.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        )}
                        {entry.metadata.generationTime && (
                          <span>{entry.metadata.generationTime}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DevPromptPanel;
