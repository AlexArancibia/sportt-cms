'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { useMainStore } from '@/stores/mainStore'; // Importa el store para obtener el shopId
import { uploadImage } from '@/app/actions/upload-file';
import { getImageUrl } from '@/lib/imageUtils';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void; // Callback para manejar la URL de la imagen subida
  currentImageUrl?: string | null; // URL de la imagen actual (opcional)
  width?: number; // Ancho del contenedor de la imagen (opcional)
  height?: number; // Alto del contenedor de la imagen (opcional)
}

export function ImageUpload({ onImageUpload, currentImageUrl, width = 200, height = 200 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const { shopSettings } = useMainStore(); // Obtén el shopId desde el store
  const shopId = shopSettings[0]?.name || 'default-shop'; // Usa un valor por defecto si no hay shopId

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Genera la presigned URL y sube la imagen a R2
      const { success, presignedUrl, fileUrl, error } = await uploadImage(
        shopId, // shopId obtenido del store
        file.name, // Nombre del archivo
        file.type, // Tipo MIME del archivo
      );

      if (!success || !presignedUrl) {
        console.error('Error al obtener la presigned URL:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate upload URL",
        });
        return;
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
        console.error('Error subiendo la imagen:', uploadResponse.statusText);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload image",
        });
        return;
      }

      console.log('Archivo subido correctamente. URL:', fileUrl);
      onImageUpload(fileUrl); // Pasa la URL de la imagen subida al callback
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error en el manejo de la subida:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image",
      });
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
        disabled={isUploading}
      />
      <label
        htmlFor="imageUpload"
        className="flex items-center justify-center w-full h-full border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
      >
        {currentImageUrl && !imageError ? (
          <div className="relative w-full h-full">
            <Image
              src={getImageUrl(currentImageUrl) || '/placeholder.svg'}
              alt="Uploaded image"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-md"
              onError={() => {
                console.error('Error loading image:', currentImageUrl);
                setImageError(true);
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.preventDefault();
                setImageError(false);
                onImageUpload('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {isUploading ? (
              <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
              </>
            )}
          </div>
        )}
      </label>
    </div>
  );
}