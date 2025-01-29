import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/axiosConfig"

interface ImageUploadResponse {
  message: string
  filename: string
  mimetype: string
  size: number
  dto: {
    description: string
  }
}

export async function uploadAndReplaceImageUrl(imageUrl: string): Promise<string> {
  try {
    // Fetch the image data
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        Accept: "image/*",
      },
    })

    // Get the content type from the response
    const contentType = response.headers["content-type"]

    // Create a filename with timestamp and correct extension
    const timestamp = Date.now()
    const extension = contentType.split("/")[1] || "jpg"
    const filename = `image-${timestamp}.${extension}`

    // Create form data
    const formData = new FormData()
    formData.append("file", new Blob([response.data], { type: contentType }), filename)
    formData.append("description", `Imported product image ${filename}`)

    // Log the form data for debugging
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    // Upload using the same endpoint as ImageGallery
    const uploadResponse = await apiClient.post<ImageUploadResponse>("/file/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("Upload successful:", uploadResponse.data)
    return uploadResponse.data.filename
  } catch (error) {
    console.error("Error uploading image:", error)
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data)
      console.error("Response status:", error.response?.status)
    }
    // If there's an error, return the original URL
    return imageUrl
  }
}

export async function processProductImages(product: any): Promise<any> {
  console.log("Starting to process product images:", product)

  try {
    if (!product.imageUrls || !Array.isArray(product.imageUrls)) {
      console.log("No images to process")
      return product
    }

    // Process all image URLs in parallel
    const updatedImageUrls = await Promise.all(
      product.imageUrls.map(async (url: string) => {
        if (!url || !isValidImageUrl(url)) {
          console.log("Skipping invalid URL:", url)
          return ""
        }
        try {
          console.log("Processing image URL:", url)
          const filename = await uploadAndReplaceImageUrl(url)
          console.log("Processed image, got filename:", filename)
          return filename
        } catch (error) {
          console.error(`Error processing image ${url}:`, error)
          return url
        }
      }),
    )

    // Update variants' imageUrl if they exist
    const updatedVariants = product.variants?.map((variant: any) => {
      if (variant.imageUrl && isValidImageUrl(variant.imageUrl)) {
        return {
          ...variant,
          imageUrl: updatedImageUrls.find((url) => url) || variant.imageUrl,
        }
      }
      return variant
    })

    const processedProduct = {
      ...product,
      imageUrls: updatedImageUrls.filter(Boolean),
      variants: updatedVariants || product.variants,
    }

    console.log("Finished processing product images:", processedProduct)
    return processedProduct
  } catch (error) {
    console.error("Error processing product images:", error)
    return product
  }
}

// Helper function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return /\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff)$/i.test(parsed.pathname)
  } catch {
    return false
  }
}


export async function uploadAndGetUrl(imageFile: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append("file", imageFile)
    formData.append("description", `Uploaded image ${imageFile.name}`)

    const response = await apiClient.post<{ filename: string }>("/file/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    

    return response.data.filename
  } catch (error) {
    console.error("Error uploading image:", error)
    return null
  }
}