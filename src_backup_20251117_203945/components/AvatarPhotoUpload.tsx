import React, { useState, useRef } from 'react';
import { Upload, Sparkles, ArrowLeft } from 'lucide-react';
import { ImageFormatValidator, getAcceptString, getFormatListText } from '../utils/imageFormatValidator';

interface AvatarPhotoUploadProps {
  onNext: (avatarData: any) => void;
  onBack?: () => void;
}

const AvatarPhotoUpload: React.FC<AvatarPhotoUploadProps> = ({ onNext, onBack }) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file format and size
      const validation = ImageFormatValidator.validateFile(file);
      if (!validation.isValid) {
        alert(`Upload Error: ${validation.errors[0]}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedPhoto(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!uploadedPhoto) return;

    setIsGenerating(true);

    try {
      console.log('📸 [AVATAR-PHOTO-UPLOAD] Storing head photo for CGI generation...');

      // Store the uploaded photo data for CGI avatar generation
      // This will be used in AvatarMeasurementsPage to trigger CGI generation
      const avatarData = {
        headPhotoUrl: uploadedPhoto,
        headPhotoData: uploadedPhoto, // Base64 data for CGI composition
        uploadedAt: new Date().toISOString(),
        readyForCGI: true,
        source: 'photo_upload_page'
      };

      console.log('✅ [AVATAR-PHOTO-UPLOAD] Head photo prepared for CGI generation:', {
        hasHeadPhoto: !!avatarData.headPhotoUrl,
        dataLength: avatarData.headPhotoData.length,
        readyForCGI: avatarData.readyForCGI
      });

      // Move to measurements page with head photo data
      onNext(avatarData);

    } catch (error) {
      console.error('❌ [AVATAR-PHOTO-UPLOAD] Photo preparation failed:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-transparent to-blue-900"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-purple-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute bottom-32 right-8 w-3 h-3 bg-pink-300 rounded-full animate-pulse opacity-60"></div>

      {/* Header */}
      <div className="flex items-center justify-between w-full mb-8 z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-black">
            Create Avatar
          </h1>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center space-y-8 z-10 max-w-md mx-auto">
        {/* Preview Box */}
        <div className="w-72 h-96 rounded-2xl overflow-hidden shadow-xl">
          {uploadedPhoto ? (
            <img
              src={uploadedPhoto}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-600 p-1 rounded-2xl">
              <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Your Photo</h3>
                <p className="text-gray-600 text-sm text-center px-4">
                  Choose a clear photo of yourself for avatar generation
                </p>
                <p className="text-gray-400 text-xs text-center px-4 mt-1">
                  Supports: {getFormatListText()} • Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {!uploadedPhoto && (
          <button
            onClick={handlePhotoUpload}
            className="relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-200/50"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-1 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/25 transition-all duration-300">
              <div className="relative bg-white rounded-xl px-8 py-4 group-hover:bg-transparent transition-all duration-300">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                    <Upload className="w-5 h-5 text-white group-hover:text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:text-white transition-all duration-300">
                      Upload Your Photo
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-purple-100 transition-all duration-300">
                      Choose a clear image
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Generate Avatar Button */}
        {uploadedPhoto && (
          <button
            onClick={handleGenerateAvatar}
            disabled={isGenerating}
            className="relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-1 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/25 transition-all duration-300">
              <div className="relative bg-white rounded-xl px-8 py-4 group-hover:bg-transparent transition-all duration-300">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                    <Sparkles className={`w-5 h-5 text-white ${isGenerating ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:text-white transition-all duration-300">
                      {isGenerating ? 'Generating...' : 'Generate Avatar'}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-purple-100 transition-all duration-300">
                      {isGenerating ? 'Creating your 3D avatar' : 'Transform into 3D avatar'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Replace Photo Button */}
        {uploadedPhoto && !isGenerating && (
          <button
            onClick={handlePhotoUpload}
            className="text-gray-500 text-sm hover:text-purple-600 hover:scale-105 transition-all duration-300 font-medium tracking-wide"
          >
            Replace photo
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarPhotoUpload;