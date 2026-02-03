import { isNetworkError } from "./axiosConfig"

/**
 * Helper unificado para extraer mensajes de error del API
 * Maneja diferentes formatos de respuesta del backend
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback

  const anyErr = error as any
  const data = anyErr?.response?.data

  // Mensaje directo del API (message)
  const apiMessage = data?.message ?? anyErr?.message
  if (Array.isArray(apiMessage)) {
    return apiMessage.filter(Boolean).join(", ")
  }
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim()
  }

  // Errores de validación (errors[] con message o constraints)
  const errors = data?.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors
      .map((e: { message?: string; constraints?: Record<string, string> }) => {
        if (typeof e?.message === "string" && e.message.trim()) return e.message.trim()
        if (e?.constraints && typeof e.constraints === "object") {
          return Object.values(e.constraints).filter(Boolean).join(", ")
        }
        return null
      })
      .filter(Boolean)
    if (parts.length > 0) return parts.join(". ")
  }

  return fallback
}

/**
 * Helper para obtener mensajes de error amigables para el usuario
 * Maneja errores de red, HTTP y mensajes del API
 */
export function getErrorMessage(error: unknown, fallback: string = "Error al cargar datos"): string {
  if (!error) return fallback

  // Errores de red
  if (isNetworkError(error) || (error as any)?.isNetworkError) {
    const networkError = error as any
    return networkError?.code === "ERR_NETWORK_CHANGED"
      ? "La conexión de red cambió. Por favor, intenta nuevamente."
      : "Error de conexión. Verifica tu conexión a internet e intenta nuevamente."
  }

  // Errores HTTP
  if ((error as any)?.response) {
    const status = (error as any).response.status
    if (status === 408 || status === 504) {
      return "La solicitud tardó demasiado. Por favor, intenta nuevamente."
    }
    if (status >= 500) {
      return "Error del servidor. Por favor, intenta nuevamente más tarde."
    }
    if (status === 404) {
      return "No se encontraron datos para los filtros seleccionados."
    }
  }

  // Intentar obtener mensaje del API
  const apiMessage = getApiErrorMessage(error, fallback)
  if (apiMessage !== fallback) {
    return apiMessage
  }

  // Fallback a mensaje de error estándar
  if (error instanceof Error) {
    return error.message || fallback
  }
  
  if (typeof error === "string") {
    return error || fallback
  }

  return fallback
}
