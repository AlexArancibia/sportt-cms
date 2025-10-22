'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
 import { useMainStore } from '@/stores/mainStore'; // Importa el store para obtener el shopId
import { uploadImage } from '@/app/actions/upload-file';

interface ImageGalleryProps {
  images: string[] | undefined;
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageGallery({ images = [], onChange, maxImages = 10, className }: ImageGalleryProps) {

  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { shopSettings } = useMainStore(); // Obtén el shopId desde el store
  const { currentStore } = useMainStore(); // Obtén el currentStore desde el store
  const shopId = currentStore || 'default-shop'; // Usa un valor por defecto si no hay shopId

  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files.length) {
      return;
    }

    setIsUploading(true);

    const uploadPromises = Array.from(files).map(async (file) => {

      try {
        // Genera la presigned URL y sube la imagen
        const { success, presignedUrl, fileUrl, error } = await uploadImage(
          shopId,
          file.name,
          file.type
        );

        if (!success || !presignedUrl) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          });
          return null;
        }
        
        // Sube el archivo directamente a R2 usando la presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          });
          return null;
        }

        return fileUrl; // Devuelve la URL completa del archivo subido
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        });
        return null;
      }
    });

    try {
      const uploadedUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

      const newImages = [...images, ...uploadedUrls];
      onChange(newImages);

      if (uploadedUrls.length > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      console.error('Error handling uploads:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process uploads",
      });
    } finally {
      setIsUploading(false);
    }
  }, [images, onChange, toast, shopId]);

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    } else {
    }
  };


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
            {images.map((imageUrl, index) => {

              return (
                <div key={index} className="relative aspect-square group">
                  <Image
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-contain bg-white rounded-md"
                    onError={(e) => console.error('Image load error:', e)}
onLoad={() => {}}
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
  );
}