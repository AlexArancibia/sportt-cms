"use client"

import { Button } from "@/components/ui/button"
import { X, Plus, ImagePlus } from "lucide-react"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"

interface VariantImageGalleryProps {
  images: string[]
  maxImages: number
  onUpload: () => void
  onRemove: (index: number) => void
  variantTitle?: string
}

export function VariantImageGallery({
  images,
  maxImages,
  onUpload,
  onRemove,
  variantTitle = "Product",
}: VariantImageGalleryProps) {
  const hasImages = images && images.length > 0

  return (
    <div className="flex items-start gap-2">
      {/* Imagen principal grande */}
      <div className="relative w-12 h-12 bg-accent rounded-md">
        {hasImages ? (
          <>
            <Image
              src={getImageUrl(images[0]) || "/placeholder.svg"}
              alt={variantTitle}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onRemove(0)
              }}
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-1 h-4 w-4 bg-background/80 rounded-full hover:bg-background"
            >
              <X className="w-2 h-2" />
            </Button>
          </>
        ) : (
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onUpload()
            }} 
            variant="ghost" 
            className="w-full h-full"
          >
            <ImagePlus className="w-5 h-5 text-gray-500" />
          </Button>
        )}
      </div>

      {/* Grilla de imágenes pequeñas */}
      <div className="flex flex-wrap gap-1 w-fit">
        {images.slice(1, maxImages).map((imageUrl, imageIndex) => (
          <div key={imageIndex + 1} className="relative w-6 h-6 bg-accent rounded">
            <Image
              src={getImageUrl(imageUrl) || "/placeholder.svg"}
              alt={`${variantTitle} - ${imageIndex + 2}`}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onRemove(imageIndex + 1)
              }}
              variant="ghost"
              size="icon"
              className="absolute -top-1 -right-1 h-3 w-3 bg-background/80 rounded-full hover:bg-background p-0"
            >
              <X className="w-1.5 h-1.5" />
            </Button>
          </div>
        ))}

        {/* Botón para agregar más imágenes */}
        {images.length < maxImages && (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onUpload()
            }}
            variant="ghost"
            size="icon"
            className="w-6 h-6 border-2 border-dashed border-muted-foreground/25 rounded hover:border-muted-foreground/50"
          >
            <Plus className="w-2 h-2 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}

