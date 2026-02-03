"use client"

import { useState } from "react"
import { useToast } from "./use-toast"
import { useAuthStore } from "@/stores/authStore"
import { useShopSettings } from "@/hooks/useShopSettings"
import { uploadImageToR2 } from "@/lib/imageUpload"

export interface UploadOptions {
  shopId?: string
  onSuccess?: (fileUrl: string, file: File) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
  maxFileSize?: number // en MB
  allowedTypes?: string[]
}

export interface UploadResult {
  success: boolean
  fileUrl?: string
  error?: string
}

const DEFAULT_SHOP_ID = "default-shop"

export function useImageUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const currentStoreId = useAuthStore((s) => s.currentStoreId)
  const needShopFromApi = !options.shopId
  const { data: shopSettings } = useShopSettings(needShopFromApi ? currentStoreId : null)

  const shopId = options.shopId ?? shopSettings?.name ?? DEFAULT_SHOP_ID

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = (options.maxFileSize || 10) * 1024 * 1024 // Default 10MB
    const allowedTypes = options.allowedTypes || ["image/jpeg", "image/png", "image/webp", "image/gif"]

    if (file.size > maxSize) {
      return { valid: false, error: `El archivo es muy grande. Máximo ${options.maxFileSize || 10}MB` }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Tipo de archivo no permitido. Solo se permiten imágenes." }
    }

    return { valid: true }
  }

  const uploadSingleImage = async (file: File): Promise<UploadResult> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      const error = validation.error || "Archivo inválido"
      options.onError?.(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      return { success: false, error }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simular progreso inicial
      setUploadProgress(10)
      options.onProgress?.(10)

      // Sube el archivo a R2 usando la API route (evita problemas de CORS)
      setUploadProgress(30)
      options.onProgress?.(30)

      const { success, fileUrl, error } = await uploadImageToR2(file, shopId)

      if (!success || !fileUrl) {
        const errorMsg = error || "Error al subir la imagen"
        options.onError?.(errorMsg)
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        })
        return { success: false, error: errorMsg }
      }

      setUploadProgress(100)
      options.onProgress?.(100)
      options.onSuccess?.(fileUrl, file)

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      })

      return { success: true, fileUrl }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error desconocido"
      options.onError?.(errorMsg)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      })
      return { success: false, error: errorMsg }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const uploadMultipleImages = async (files: FileList | File[]): Promise<UploadResult[]> => {
    const fileArray = Array.from(files)
    const results: UploadResult[] = []

    for (const file of fileArray) {
      const result = await uploadSingleImage(file)
      results.push(result)
    }

    return results
  }

  const triggerFileSelect = (
    options: {
      multiple?: boolean
      accept?: string
      onSelect?: (files: FileList | null) => void
    } = {},
  ) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = options.accept || "image/*"
    input.multiple = options.multiple || false

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      options.onSelect?.(target.files)

      if (target.files) {
        if (options.multiple) {
          uploadMultipleImages(target.files)
        } else if (target.files[0]) {
          uploadSingleImage(target.files[0])
        }
      }
    }

    input.click()
  }

  return {
    uploadSingleImage,
    uploadMultipleImages,
    triggerFileSelect,
    isUploading,
    uploadProgress,
  }
}
