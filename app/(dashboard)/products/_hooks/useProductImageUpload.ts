import { useToast } from "@/hooks/use-toast"
import { uploadImage } from "@/app/actions/upload-file"

export function useProductImageUpload(currentStore: string | null) {
  const { toast } = useToast()

  const uploadSingleImage = async (
    file: File,
    maxImages: number,
    currentImagesCount: number
  ): Promise<string | null> => {
    if (currentImagesCount >= maxImages) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pueden agregar más de ${maxImages} imágenes`,
      })
      return null
    }

    try {
      const { success, presignedUrl, fileUrl, error } = await uploadImage(
        currentStore || "",
        file.name,
        file.type
      )

      if (!success || !presignedUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al subir ${file.name}`,
        })
        return null
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadResponse.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al subir ${file.name}`,
        })
        return null
      }

      toast({
        title: "Imagen subida",
        description: "La imagen se subió correctamente",
      })

      return fileUrl
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error al subir ${file.name}`,
      })
      return null
    }
  }

  const handleImageUpload = async (
    onSuccess: (fileUrl: string) => void,
    maxImages: number = 10,
    currentImagesCount: number = 0
  ) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const fileUrl = await uploadSingleImage(file, maxImages, currentImagesCount)
      if (fileUrl) {
        onSuccess(fileUrl)
      }
    }
    input.click()
  }

  return {
    handleImageUpload,
    uploadSingleImage,
  }
}

