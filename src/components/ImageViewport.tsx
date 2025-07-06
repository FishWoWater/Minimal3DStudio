import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileImage } from 'lucide-react';

interface ImageViewportProps {
  selectedImage: string | null;
  onImageSelect: (file: File) => void;
  isGenerating: boolean;
}

export const ImageViewport: React.FC<ImageViewportProps> = ({
  selectedImage,
  onImageSelect,
  isGenerating,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  }, [onImageSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="viewport">
      <div className="viewport-header">
        <span className="viewport-title">Image Viewport</span>
        <div className="viewport-controls">
          <button className="btn btn-small" onClick={handleBrowseClick}>
            <FileImage size={14} /> Browse
          </button>
        </div>
      </div>
      
      <div className="viewport-content">
        {selectedImage ? (
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="selected-image"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        ) : (
          <div 
            className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <div className="drop-zone-content">
              <Upload size={48} className="upload-icon" />
              <div>
                <p>Drop an image here or click to browse</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  Supports JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isGenerating && (
          <div className="generating-overlay">
            <div className="spinner"></div>
            <p>Generating image...</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}; 