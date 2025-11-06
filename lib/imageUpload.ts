/**
 * Helper function para subir imágenes a R2 a través de la API route
 */
export async function uploadImageToR2(file: File, shopId: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('shopId', shopId)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error uploading file' }))
      return { success: false, error: errorData.error || 'Error uploading file' }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error uploading file' }
  }
}

