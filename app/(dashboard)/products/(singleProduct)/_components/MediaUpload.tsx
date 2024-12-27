import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ImageIcon, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'

interface MediaUploadSectionProps {
  coverImage: string | null | undefined;
  galleryImages: string[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => void;
  onRemoveGalleryImage: (index: number) => void;
}

export function MediaUploadSection({
  coverImage,
  galleryImages,
  onImageUpload,
  onRemoveGalleryImage
}: MediaUploadSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Media</h3>
      
      {/* Cover Image Section */}
      <div className="flex gap-4">
 
        <div className="w-[200px] h-[200px] relative overflow-hidden rounded-lg border">
          <Input
            id="coverImage"
            type="file"
            onChange={(e) => onImageUpload(e, 'cover')}
            accept="image/*"
            className="hidden"
          />
          <Label
            htmlFor="coverImage"
            className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {coverImage ? (
              <Image
                src={getImageUrl(coverImage)}
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
        <div className="grid grid-cols-3 gap-4">
          {galleryImages.map((filename, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={getImageUrl(filename)}
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
              onChange={(e) => onImageUpload(e, 'gallery')}
              accept="image/*"
              multiple
              className="hidden"
            />
          </Label>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="space-y-2">

      </div>
    </div>
  )
}

