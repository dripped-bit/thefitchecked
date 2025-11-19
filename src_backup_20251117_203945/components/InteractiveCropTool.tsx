/**
 * Interactive Crop Tool
 * Allows users to manually draw crop boxes around garments for extraction
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Check } from 'lucide-react';

export interface CropBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface InteractiveCropToolProps {
  imageUrl: string;
  onComplete: (crops: CropBox[]) => void;
  onCancel: () => void;
  suggestedCrops?: CropBox[];
}

type DragMode = 'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'create';

export const InteractiveCropTool: React.FC<InteractiveCropToolProps> = ({
  imageUrl,
  onComplete,
  onCancel,
  suggestedCrops = []
}) => {
  const [crops, setCrops] = useState<CropBox[]>(suggestedCrops);
  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tempCrop, setTempCrop] = useState<CropBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Image and scale state
  const [imageScale, setImageScale] = useState(1);

  // Load and scale image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate canvas size to fit container while maintaining aspect ratio
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = window.innerHeight - 200; // Leave room for UI

      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
        1 // Don't upscale
      );

      // Store scale factor for coordinate conversion
      setImageScale(scale);

      setCanvasSize({
        width: img.width * scale,
        height: img.height * scale
      });

      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw crops (clear overlay where crops are)
    const allCrops = tempCrop ? [...crops, tempCrop] : crops;
    allCrops.forEach(crop => {
      // Clear overlay in crop area
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
      ctx.restore();

      // Explicitly reset composite operation to default
      ctx.globalCompositeOperation = 'source-over';

      // Draw crop border
      const isActive = crop.id === activeCropId;
      ctx.strokeStyle = isActive ? '#FF1B6B' : '#FFFFFF';
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

      // Draw corner handles
      if (isActive) {
        const handleSize = 12;
        ctx.fillStyle = '#FF1B6B';
        
        // Top-left
        ctx.fillRect(crop.x - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
        // Top-right
        ctx.fillRect(crop.x + crop.width - handleSize/2, crop.y - handleSize/2, handleSize, handleSize);
        // Bottom-left
        ctx.fillRect(crop.x - handleSize/2, crop.y + crop.height - handleSize/2, handleSize, handleSize);
        // Bottom-right
        ctx.fillRect(crop.x + crop.width - handleSize/2, crop.y + crop.height - handleSize/2, handleSize, handleSize);
      }

      // Draw label
      if (crop.label) {
        ctx.fillStyle = '#FF1B6B';
        const labelWidth = ctx.measureText(crop.label).width + 16;
        ctx.fillRect(crop.x, crop.y - 30, labelWidth, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px -apple-system, system-ui, sans-serif';
        ctx.fillText(crop.label, crop.x + 8, crop.y - 10);
      }
    });
  }, [crops, activeCropId, imageLoaded, canvasSize, tempCrop]);

  // Get mouse/touch position relative to canvas
  const getCanvasPosition = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Check if position is on a corner handle
  const getCornerHandle = (crop: CropBox, x: number, y: number): DragMode => {
    const handleSize = 12;
    const tolerance = handleSize;

    if (Math.abs(x - crop.x) < tolerance && Math.abs(y - crop.y) < tolerance) {
      return 'resize-tl';
    }
    if (Math.abs(x - (crop.x + crop.width)) < tolerance && Math.abs(y - crop.y) < tolerance) {
      return 'resize-tr';
    }
    if (Math.abs(x - crop.x) < tolerance && Math.abs(y - (crop.y + crop.height)) < tolerance) {
      return 'resize-bl';
    }
    if (Math.abs(x - (crop.x + crop.width)) < tolerance && Math.abs(y - (crop.y + crop.height)) < tolerance) {
      return 'resize-br';
    }
    return 'none';
  };

  // Check if position is inside a crop
  const getCropAtPosition = (x: number, y: number): CropBox | null => {
    // Check in reverse order (topmost first)
    for (let i = crops.length - 1; i >= 0; i--) {
      const crop = crops[i];
      if (x >= crop.x && x <= crop.x + crop.width &&
          y >= crop.y && y <= crop.y + crop.height) {
        return crop;
      }
    }
    return null;
  };

  // Handle start (mouse down / touch start)
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPosition(e);

    // Check if clicking on active crop's corner
    const activeCrop = crops.find(c => c.id === activeCropId);
    if (activeCrop) {
      const corner = getCornerHandle(activeCrop, pos.x, pos.y);
      if (corner !== 'none') {
        setDragMode(corner);
        setDragStart(pos);
        return;
      }
    }

    // Check if clicking inside any crop
    const crop = getCropAtPosition(pos.x, pos.y);
    if (crop) {
      setActiveCropId(crop.id);
      setDragMode('move');
      setDragStart(pos);
      return;
    }

    // Start creating new crop
    setDragMode('create');
    setDragStart(pos);
    setTempCrop({
      id: `temp-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      label: `Item ${crops.length + 1}`
    });
  };

  // Handle move (mouse move / touch move)
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragMode === 'none' || !dragStart) return;
    e.preventDefault();

    const pos = getCanvasPosition(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    if (dragMode === 'create' && tempCrop) {
      // Update temp crop
      setTempCrop({
        ...tempCrop,
        width: dx,
        height: dy
      });
    } else if (dragMode === 'move' && activeCropId) {
      // Move crop
      setCrops(crops.map(crop => {
        if (crop.id === activeCropId) {
          return {
            ...crop,
            x: Math.max(0, Math.min(canvasSize.width - crop.width, crop.x + dx)),
            y: Math.max(0, Math.min(canvasSize.height - crop.height, crop.y + dy))
          };
        }
        return crop;
      }));
      setDragStart(pos);
    } else if (dragMode.startsWith('resize-') && activeCropId) {
      // Resize crop
      setCrops(crops.map(crop => {
        if (crop.id === activeCropId) {
          let newCrop = { ...crop };
          
          if (dragMode.includes('l')) { // Left edge
            newCrop.x += dx;
            newCrop.width -= dx;
          }
          if (dragMode.includes('r')) { // Right edge
            newCrop.width += dx;
          }
          if (dragMode.includes('t')) { // Top edge
            newCrop.y += dy;
            newCrop.height -= dy;
          }
          if (dragMode.includes('b')) { // Bottom edge
            newCrop.height += dy;
          }

          // Enforce minimum size
          if (newCrop.width < 50) {
            if (dragMode.includes('l')) newCrop.x = crop.x + crop.width - 50;
            newCrop.width = 50;
          }
          if (newCrop.height < 50) {
            if (dragMode.includes('t')) newCrop.y = crop.y + crop.height - 50;
            newCrop.height = 50;
          }

          return newCrop;
        }
        return crop;
      }));
      setDragStart(pos);
    }
  };

  // Handle end (mouse up / touch end)
  const handleEnd = () => {
    if (dragMode === 'create' && tempCrop) {
      // Finalize temp crop if it's large enough
      if (Math.abs(tempCrop.width) > 30 && Math.abs(tempCrop.height) > 30) {
        const normalizedCrop: CropBox = {
          ...tempCrop,
          id: `crop-${Date.now()}`,
          x: tempCrop.width < 0 ? tempCrop.x + tempCrop.width : tempCrop.x,
          y: tempCrop.height < 0 ? tempCrop.y + tempCrop.height : tempCrop.y,
          width: Math.abs(tempCrop.width),
          height: Math.abs(tempCrop.height)
        };
        setCrops([...crops, normalizedCrop]);
        setActiveCropId(normalizedCrop.id);
      }
      setTempCrop(null);
    }

    setDragMode('none');
    setDragStart(null);
  };

  // Add new crop box
  const addCropBox = () => {
    const newCrop: CropBox = {
      id: `crop-${Date.now()}`,
      x: 50,
      y: 50,
      width: Math.min(200, canvasSize.width - 100),
      height: Math.min(300, canvasSize.height - 100),
      label: `Item ${crops.length + 1}`
    };
    setCrops([...crops, newCrop]);
    setActiveCropId(newCrop.id);
  };

  // Remove crop
  const removeCrop = (id: string) => {
    setCrops(crops.filter(c => c.id !== id));
    if (activeCropId === id) {
      setActiveCropId(null);
    }
  };

  // Update crop label
  const updateCropLabel = (id: string, label: string) => {
    setCrops(crops.map(crop => 
      crop.id === id ? { ...crop, label } : crop
    ));
  };

  return (
    <div className="fixed inset-0 z-[10002] bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-semibold text-lg">Crop Garments</h2>
        <div className="w-10" />
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center bg-black p-4"
      >
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="touch-none max-w-full max-h-full"
            style={{ cursor: dragMode !== 'none' ? 'grabbing' : 'crosshair' }}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-900 px-4 py-2 text-center border-t border-gray-700">
        <p className="text-gray-300 text-sm">
          {crops.length === 0 
            ? 'Draw a box around each garment you want to extract'
            : 'Drag corners to resize • Tap + to add more items'}
        </p>
      </div>

      {/* Crop List */}
      {crops.length > 0 && (
        <div className="bg-gray-900 px-4 py-3 max-h-32 overflow-y-auto border-t border-gray-700">
          {crops.map((crop, idx) => (
            <div
              key={crop.id}
              className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${
                crop.id === activeCropId ? 'bg-pink-500/20 border border-pink-500' : 'bg-gray-800'
              }`}
              onClick={() => setActiveCropId(crop.id)}
            >
              <input
                type="text"
                value={crop.label}
                onChange={(e) => updateCropLabel(crop.id, e.target.value)}
                className="flex-1 bg-transparent text-white text-sm outline-none"
                placeholder={`Item ${idx + 1}`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCrop(crop.id);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div 
        className="bg-gray-900 px-4 py-4 flex gap-3 border-t border-gray-700"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={addCropBox}
          className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
        <button
          onClick={() => {
            // Convert canvas coordinates to original image coordinates
            const originalImageCrops = crops.map(crop => ({
              ...crop,
              x: crop.x / imageScale,
              y: crop.y / imageScale,
              width: crop.width / imageScale,
              height: crop.height / imageScale
            }));
            console.log('✂️ [CROP-TOOL] Converting canvas coords to image coords');
            console.log('📐 [CROP-TOOL] Scale factor:', imageScale);
            console.log('📐 [CROP-TOOL] Canvas crop:', crops[0]);
            console.log('📐 [CROP-TOOL] Image crop:', originalImageCrops[0]);
            onComplete(originalImageCrops);
          }}
          disabled={crops.length === 0}
          className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transition-all"
        >
          <Check className="w-5 h-5" />
          Extract {crops.length} {crops.length === 1 ? 'Item' : 'Items'}
        </button>
      </div>
    </div>
  );
};
