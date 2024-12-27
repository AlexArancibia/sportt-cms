import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import apiClient from '@/lib/axiosConfig';
import { getImageUrl } from '@/lib/imageUtils';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImageUrl?: string | null;
  width?: number;
  height?: number;
}

export function ImageUpload({ onImageUpload, currentImageUrl, width = 200, height = 200 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const imageUrl = response.data.filename; // Adjust this based on your API response
      onImageUpload(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      // You might want to add error handling here, e.g., showing a toast notification
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ width, height }} className="relative">
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="imageUpload"
      />
      <label
        htmlFor="imageUpload"
        className="flex items-center justify-center w-full h-full border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
      >
        {currentImageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={getImageUrl(currentImageUrl)}
              alt="Uploaded image"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-md"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.preventDefault();
                onImageUpload('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
          </div>
        )}
      </label>
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}

