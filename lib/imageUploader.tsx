/* Temporarily disabled: currently unused image uploader helper.
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/axiosConfig"
import { uploadImage } from "@/app/actions/upload-file"

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
    // Validar que la URL sea válida antes de intentar fetch
    if (!isValidImageUrl(imageUrl)) {
      console.warn('Invalid image URL, returning as is:', imageUrl)
      return imageUrl
    }

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

 


export async function processProductImages(product: any, shopId: string): Promise<any> {
  console.log("Starting to process product images:", product);

  try {
    if (!product.imageUrls || !Array.isArray(product.imageUrls)) {
      console.log("No images to process");
      return product;
    }

    // Procesa todas las URLs de imágenes en paralelo
    const updatedImageUrls = await Promise.all(
      product.imageUrls.map(async (url: string) => {
        if (!url || !isValidImageUrl(url)) {
          console.log("Skipping invalid URL:", url);
          return "";
        }

        try {
          console.log("Processing image URL:", url);

          // Obtén el archivo de imagen desde la URL
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], "image.jpg", { type: blob.type });

          // Genera la presigned URL y sube la imagen a R2
          const { success,presignedUrl, fileUrl, error } = await uploadImage(
            shopId, // shopId pasado como parámetro
            file.name, // Nombre del archivo
            file.type, // Tipo MIME del archivo
          );

          if (!success || !presignedUrl) {
            console.error('Error al subir la imagen:', error);
            return url; // Devuelve la URL original si falla la subida
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
            return url; // Devuelve la URL original si falla la subida
          }

          console.log("Processed image, got URL:", fileUrl);
          return fileUrl; // Devuelve la nueva URL de la imagen
        } catch (error) {
          console.error(`Error processing image ${url}:`, error);
          return url; // Devuelve la URL original si ocurre un error
        }
      }),
    );

    // Actualiza las URLs de las imágenes en las variantes (si existen)
    const updatedVariants = product.variants?.map((variant: any) => {
      if (variant.imageUrl && isValidImageUrl(variant.imageUrl)) {
        return {
          ...variant,
          imageUrl: updatedImageUrls.find((url) => url) || variant.imageUrl,
        };
      }
      return variant;
    });

    // Crea el producto procesado con las URLs de las imágenes actualizadas
    const processedProduct = {
      ...product,
      imageUrls: updatedImageUrls.filter(Boolean), // Filtra URLs vacías
      variants: updatedVariants || product.variants,
    };

    console.log("Finished processing product images:", processedProduct);
    return processedProduct;
  } catch (error) {
    console.error("Error processing product images:", error);
    return product; // Devuelve el producto original si ocurre un error
  }
}
 

// Helper function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  try {
    // Si es solo un nombre de archivo (sin http/https), considerarlo inválido para URL parsing
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      console.warn('Invalid image URL format (filename only):', url)
      return false
    }
    
    const parsed = new URL(url, url.startsWith('/') ? 'http://dummy.com' : undefined)
    return /\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff)$/i.test(parsed.pathname)
  } catch (error) {
    console.error('Error parsing image URL:', url, error)
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
*/