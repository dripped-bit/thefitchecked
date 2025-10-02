import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, RotateCcw, Play, Settings, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { avaturnService, AvaturnService, Avatar3DResponse, AvaturnProcessingStatus } from '../services/avaturnService';
import { BodyMeasurements, ProportionValidationResult } from '../utils/proportionCalculator';

interface AvatarGenerator3DProps {
  capturedPhotos: any[];
  measurements: BodyMeasurements;
  validation: ProportionValidationResult;
  onBack?: () => void;
  onComplete?: (avatar: Avatar3DResponse) => void;
}

interface GenerationProgress {
  stage: string;
  progress: number;
  message: string;
  estimatedTime?: number;
}

const AvatarGenerator3D: React.FC<AvatarGenerator3DProps> = ({
  capturedPhotos,
  measurements,
  validation,
  onBack,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [avatar, setAvatar] = useState<Avatar3DResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarSettings, setAvatarSettings] = useState({
    quality: 'high' as 'standard' | 'high' | 'ultra',
    generateAnimations: true,
    includeBlendshapes: true,
    exportFormat: 'gltf' as 'gltf' | 'fbx' | 'obj',
    resolution: '2k' as '1k' | '2k' | '4k',
    style: 'realistic' as 'realistic' | 'stylized'
  });

  const startGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress({
      stage: 'Preparing photos and measurements',
      progress: 0,
      message: 'Initializing 3D avatar generation...'
    });

    try {
      // Create avatar request
      const request = AvaturnService.createAvatarRequest(
        capturedPhotos,
        measurements,
        {
          bodyType: validation.bodyType,
          ...avatarSettings
        }
      );

      // Validate request
      const validationResult = avaturnService.validateRequest(request);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Start avatar generation
      setGenerationProgress({
        stage: 'Uploading photos',
        progress: 10,
        message: 'Uploading your photos to secure servers...'
      });

      const avatarResponse = await avaturnService.generateAvatar(request);

      // Monitor progress
      await avaturnService.waitForCompletion(
        avatarResponse.avatarId,
        (status: AvaturnProcessingStatus) => {
          setGenerationProgress({
            stage: status.stage,
            progress: status.progress,
            message: status.message || 'Processing your 3D avatar...',
            estimatedTime: status.estimatedTimeRemaining
          });
        }
      );

      // Get final result
      const completedAvatar = await avaturnService.downloadAvatar(avatarResponse.avatarId);
      setAvatar(completedAvatar);
      onComplete?.(completedAvatar);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPhotosPreview = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {capturedPhotos.map((photo, index) => (
        <div key={photo.id} className="relative">
          <img
            src={photo.dataUrl}
            alt={`${photo.pose} view`}
            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
          />
          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {photo.pose} {photo.id.includes('full') ? 'full' : 'upper'}
          </div>
          <div className={`absolute top-1 right-1 w-4 h-4 rounded-full ${
            photo.validation.score >= 80 ? 'bg-green-500' :
            photo.validation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      ))}
    </div>
  );

  const renderMeasurementsSummary = () => (
    <div className="bg-gray-50 rounded-xl p-4 mb-6">
      <h3 className="font-semibold text-lg mb-3">Body Measurements</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span>Height:</span>
          <span className="font-medium">{measurements.height}cm</span>
        </div>
        <div className="flex justify-between">
          <span>Chest:</span>
          <span className="font-medium">{measurements.chest}cm</span>
        </div>
        <div className="flex justify-between">
          <span>Waist:</span>
          <span className="font-medium">{measurements.waist}cm</span>
        </div>
        <div className="flex justify-between">
          <span>Hips:</span>
          <span className="font-medium">{measurements.hips}cm</span>
        </div>
        <div className="flex justify-between">
          <span>Shoulders:</span>
          <span className="font-medium">{measurements.shoulders}cm</span>
        </div>
        <div className="flex justify-between">
          <span>Inseam:</span>
          <span className="font-medium">{measurements.inseam}cm</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-medium">Body Type:</span>
          <span className="text-purple-600 font-semibold">{validation.bodyType}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-medium">Proportion Score:</span>
          <span className={`font-bold ${
            validation.score >= 85 ? 'text-green-600' :
            validation.score >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {validation.score}/100
          </span>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Avatar Settings</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-purple-600 hover:text-purple-800"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={avatarSettings.quality}
              onChange={(e) => setAvatarSettings(prev => ({ ...prev, quality: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resolution</label>
            <select
              value={avatarSettings.resolution}
              onChange={(e) => setAvatarSettings(prev => ({ ...prev, resolution: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="1k">1K (1024x1024)</option>
              <option value="2k">2K (2048x2048)</option>
              <option value="4k">4K (4096x4096)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <select
              value={avatarSettings.exportFormat}
              onChange={(e) => setAvatarSettings(prev => ({ ...prev, exportFormat: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="gltf">GLTF (Recommended)</option>
              <option value="fbx">FBX</option>
              <option value="obj">OBJ</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={avatarSettings.generateAnimations}
                onChange={(e) => setAvatarSettings(prev => ({ ...prev, generateAnimations: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Include Animations</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={avatarSettings.includeBlendshapes}
                onChange={(e) => setAvatarSettings(prev => ({ ...prev, includeBlendshapes: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Include Facial Blendshapes</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );

  const renderGenerationProgress = () => {
    if (!generationProgress) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          <h3 className="font-semibold text-lg">Generating Your 3D Avatar</h3>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{generationProgress.stage}</span>
            <span>{generationProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.progress}%` }}
            />
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-2">{generationProgress.message}</p>

        {generationProgress.estimatedTime && (
          <p className="text-purple-600 text-sm font-medium">
            Estimated time remaining: {formatTime(Math.floor(generationProgress.estimatedTime / 1000))}
          </p>
        )}
      </div>
    );
  };

  const renderCompletedAvatar = () => {
    if (!avatar) return null;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="font-semibold text-lg">Your 3D Avatar is Ready!</h3>
        </div>

        {avatar.previewUrl && (
          <div className="mb-4">
            <img
              src={avatar.previewUrl}
              alt="Generated 3D Avatar"
              className="w-full max-w-sm mx-auto rounded-lg border border-gray-200"
            />
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Avatar Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Vertices: {avatar.metadata.vertices.toLocaleString()}</div>
            <div>Faces: {avatar.metadata.faces.toLocaleString()}</div>
            <div>Materials: {avatar.metadata.materials}</div>
            <div>Bones: {avatar.metadata.bones || 'N/A'}</div>
          </div>
          {avatar.metadata.animations && (
            <div className="mt-2">
              <span className="font-medium">Animations: </span>
              <span className="text-sm">{avatar.metadata.animations.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.open(avatar.downloadUrls?.model, '_blank')}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Avatar</span>
          </button>

          <button
            onClick={() => {/* Implement share functionality */}}
            className="bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-800">Generation Failed</h3>
        </div>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            setError(null);
            startGeneration();
          }}
          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/50 rounded-full transition-colors"
          disabled={isGenerating}
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold">Generate 3D Avatar</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        {!isGenerating && !avatar && (
          <>
            <h2 className="text-xl font-semibold mb-4">Review Your Data</h2>

            {/* Photos Preview */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Captured Photos ({capturedPhotos.length}/6)</h3>
              {renderPhotosPreview()}
            </div>

            {/* Measurements Summary */}
            {renderMeasurementsSummary()}

            {/* Settings */}
            {renderSettings()}

            {/* Generate Button */}
            <button
              onClick={startGeneration}
              disabled={capturedPhotos.length !== 6}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>Generate 3D Avatar</span>
            </button>

            {capturedPhotos.length !== 6 && (
              <p className="text-center text-red-600 text-sm mt-2">
                All 6 photos are required for 3D avatar generation
              </p>
            )}
          </>
        )}

        {/* Generation Progress */}
        {renderGenerationProgress()}

        {/* Error Display */}
        {renderError()}

        {/* Completed Avatar */}
        {renderCompletedAvatar()}
      </div>
    </div>
  );
};

export default AvatarGenerator3D;