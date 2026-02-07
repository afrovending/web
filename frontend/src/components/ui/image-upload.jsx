import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    const newImages = [...images];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`);
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
        newImages.push(imageUrl);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
    onImagesChange(newImages);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <img 
                src={url} 
                alt={`Upload ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer
            hover:border-primary/50 hover:bg-muted/50 transition-colors
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-muted rounded-full">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload images</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP up to 5MB ({maxImages - images.length} remaining)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export { ImageUpload };
