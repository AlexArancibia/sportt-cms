'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import apiClient from '@/lib/axiosConfig'
import { useToast } from "@/hooks/use-toast"

interface ImageUploadResponse {
  message: string
  filename: string
  mimetype: string
  size: number
  dto: {
    description: string
  }
}

interface ImageGalleryProps {
  images:  string[] | undefined;
  onChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

export function ImageGallery({ images = [], onChange, maxImages = 10, className }: ImageGalleryProps) {
  console.log('ImageGallery rendered with props:', { images, maxImages, className });
  
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = useCallback(async (files: FileList) => {
    console.log('handleImageUpload called with files:', files);
    if (!files.length) {
      console.log('No files provided');
      return;
    }

    setIsUploading(true)
    console.log('Starting upload process for', files.length, 'files');

    const uploadPromises = Array.from(files).map(async (file) => {
      console.log('Processing file:', file.name);
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', file.name)

      try {
        console.log('Sending request to /file/upload for:', file.name);
        const response = await apiClient.post<ImageUploadResponse>('/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        console.log('Upload response for', file.name, ':', response.data);
        return response.data.filename
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        })
        return null
      }
    })

    try {
      console.log('Waiting for all uploads to complete...');
      const uploadedFilenames = (await Promise.all(uploadPromises)).filter((filename): filename is string => filename !== null)
      console.log('All uploads completed. Filenames:', uploadedFilenames);
      
      const newImages = [...images, ...uploadedFilenames];
      console.log('New images array:', newImages);
      onChange(newImages)
      
      if (uploadedFilenames.length > 0) {
        console.log('Showing success toast for', uploadedFilenames.length, 'files');
        toast({
          title: "Success",
          description: `Successfully uploaded ${uploadedFilenames.length} image${uploadedFilenames.length > 1 ? 's' : ''}`,
        })
      }
    } catch (error) {
      console.error('Error handling uploads:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process uploads",
      })
    } finally {
      console.log('Upload process completed, resetting isUploading state');
      setIsUploading(false)
    }
  }, [images, onChange, toast])

  const handleRemoveImage = (index: number) => {
    console.log('handleRemoveImage called for index:', index);
    const newImages = [...images]
    newImages.splice(index, 1)
    console.log('New images array after removal:', newImages);
    onChange(newImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    console.log('Drag over event detected');
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    console.log('Drop event detected');
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('Files detected in drop event:', e.dataTransfer.files);
      handleImageUpload(e.dataTransfer.files)
    } else {
      console.log('No files found in drop event');
    }
  }

  console.log('Current images state:', images);
  console.log('Is uploading:', isUploading);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div 
          className="border-2 border-dashed border-zinc-700 rounded-lg p-8"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Input
            type="file"
            id="gallery-upload"
            className="hidden"
            onChange={(e) => {
              console.log('File input change event:', e.target.files);
              if (e.target.files) handleImageUpload(e.target.files);
            }}
            accept="image/*"
            multiple
            disabled={isUploading}
          />
          <Label
            htmlFor="gallery-upload"
            className="flex flex-col items-center justify-center text-center cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-zinc-400 mb-2" />
            )}
            <p className="text-sm text-zinc-400">
              {isUploading 
                ? "Uploading images..." 
                : "Drag and drop images here or click to upload"}
            </p>
            {maxImages && (
              <p className="text-xs text-zinc-500 mt-1">
                Maximum {maxImages} images
              </p>
            )}
          </Label>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
            {images.map((filename, index) => {
              console.log('Rendering image:', filename, 'at index:', index);
              const imageUrl = getImageUrl(filename);
              console.log('Generated image URL:', imageUrl);
              
              return (
                <div key={index} className="relative aspect-square group">
                  <Image
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                    onError={(e) => console.error('Image load error:', e)}
                    onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

