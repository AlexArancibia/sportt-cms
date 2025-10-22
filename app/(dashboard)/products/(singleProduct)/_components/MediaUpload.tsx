import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageIcon, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/imageUtils';
import { useMainStore } from '@/stores/mainStore'; // Importa tu store
 
import { useState } from 'react';
import { uploadImage } from "@/app/actions/upload-file";

interface MediaUploadSectionProps {
  coverImage: string | null | undefined;
  galleryImages: string[];
  onImageUpload: (url: string, type: 'cover' | 'gallery') => void;
  onRemoveGalleryImage: (index: number) => void;
}

export function MediaUploadSection({
  coverImage,
  galleryImages,
  onImageUpload,
  onRemoveGalleryImage
}: MediaUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false); // Estado para manejar la carga
  const { shopSettings } = useMainStore(); // Obtén el shopId desde el store
  const { currentStore } = useMainStore(); // Obtén el currentStore desde el store
  const shopId = currentStore || 'default-shop'; // Usa un valor por defecto si no hay shopId

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Genera la presigned URL y sube la imagen
      const { success, fileUrl, error } = await uploadImage(shopId, file.name, file.type);

      if (!success || !fileUrl) {
        console.error('Error al subir la imagen:', error);
        return;
      }

      // Sube el archivo directamente a R2 usando la presigned URL
      const uploadResponse = await fetch(fileUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        console.error('Error subiendo el archivo:', uploadResponse.statusText);
        return;
      }

      // Notifica al componente padre que la imagen se subió correctamente
      onImageUpload(fileUrl, type);
    } catch (error) {
      console.error('Error en el manejo de la subida:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Media</h3>
      
      {/* Cover Image Section */}
      <div className="flex gap-4">
        <div className="w-[200px] h-[200px] relative overflow-hidden rounded-lg border">
          <Input
            id="coverImage"
            type="file"
            onChange={(e) => handleImageUpload(e, 'cover')}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <Label
            htmlFor="coverImage"
            className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {coverImage ? (
              <Image
                src={(coverImage)}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload cover image</span>
              </div>
            )}
          </Label>
        </div>

        {/* Gallery Section */}
        <div className="grid grid-cols-3 gap-4">
          {galleryImages.map((filename, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={(filename)}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => onRemoveGalleryImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Label
            htmlFor="galleryImages"
            className="aspect-square flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:border-primary"
          >
            <div className="text-center w-[120px]">
              <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add image</span>
            </div>
            <Input
              id="galleryImages"
              type="file"
              onChange={(e) => handleImageUpload(e, 'gallery')}
              accept="image/*"
              multiple
              className="hidden"
              disabled={isUploading}
            />
          </Label>
        </div>
      </div>
    </div>
  );
}