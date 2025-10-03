"use client"

import { useToast } from "./use-toast"
import { normalizeApiError } from "@/lib/error"
import { AxiosError } from "axios"

/**
 * Hook que proporciona manejo consistente de errores de API
 * Especialmente útil para mostrar mensajes específicos de errores 400 del servidor
 */
export function useApiError() {
  const { toast } = useToast()

  /**
   * Maneja un error de API y muestra el mensaje correspondiente
   * @param error - El error capturado
   * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
   * @param title - Título del toast (por defecto "Error")
   */
  const handleError = (
    error: unknown, 
    defaultMessage: string = "Ocurrió un error inesperado",
    title: string = "Error"
  ) => {
    console.error("API Error:", error)
    
    // Intentar obtener el error normalizado si es un error de Axios
    const normalizedError = normalizeApiError(error)
    
    // Usar el mensaje específico del servidor, o el mensaje por defecto
    const message = normalizedError.userMessage || defaultMessage
    
    toast({
      variant: "destructive",
      title,
      description: message,
    })
  }

  /**
   * Helper específico para errores 400 (Bad Request)
   * Muestra el mensaje específico del servidor sobre qué datos están mal
   */
  const handle400Error = (
    error: unknown,
    operation: string = "operación"
  ) => {
    console.error(`400 Error during ${operation}:`, error)
    
    const normalizedError = normalizeApiError(error)
    
    // Para errores 400, siempre mostrar el mensaje del servidor
    const message = normalizedError.userMessage || 
      `Error en los datos enviados. Los datos proporcionados para ${operation} no son válidos.`
    
    toast({
      variant: "destructive",
      title: "Datos inválidos",
      description: message,
    })
  }

  /**
   * Helper específico para errores 422 (Unprocessable Entity)
   * También común para errores de validación
   */
  const handle422Error = (
    error: unknown,
    operation: string = "operación"
  ) => {
    console.error(`422 Error during ${operation}:`, error)
    
    const normalizedError = normalizeApiError(error)
    
    const message = normalizedError.userMessage || 
      `Los datos proporcionados para ${operation} contienen errores de validación.`
    
    toast({
      variant: "destructive", 
      title: "Error de validación",
      description: message,
    })
  }

  /**
   * Helper genérico que maneja automáticamente diferentes tipos de errores
   */
  const handleAnyError = (
    error: unknown,
    context: {
      operation: string
      defaultMessage?: string
      title?: string
    }
  ) => {
    console.error(`Error during ${context.operation}:`, error)
    
    const normalizedError = normalizeApiError(error)
    
    let title = "Error"
    let message = normalizedError.userMessage || context.defaultMessage || `Error al ${context.operation}`
    
    // Personalizar título según el tipo de error
    switch (normalizedError.statusCode) {
      case 400:
        title = "Datos inválidos"
        break
      case 401:
        title = "Sesión expirada"
        break
      case 403:
        title = "Sin permisos"
        break
      case 404:
        title = "No encontrado"
        break
      case 422:
        title = "Error de validación"
        break
      case 500:
        title = "Error del servidor"
        break
    }
    
    if (context.title) {
      title = context.title
    }
    
    toast({
      variant: "destructive",
      title,
      description: message,
    })
  }

  return {
    handleError,
    handle400Error,
    handle422Error,
    handleAnyError,
  }
}
