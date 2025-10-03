import type { AxiosError } from "axios"

export type NormalizedError = {
  userMessage: string
  statusCode?: number
  code?: string
  details?: unknown
  isNetworkError?: boolean
}

export function normalizeApiError(error: unknown): NormalizedError {
  // Axios error branch
  const axiosError = error as AxiosError<any>

  if (axiosError?.isAxiosError) {
    const statusCode = axiosError.response?.status
    const responseData = axiosError.response?.data as any

    // Try to extract a meaningful message from common API shapes
    const apiMessage =
      responseData?.message ||
      responseData?.error ||
      (typeof responseData === "string" ? responseData : undefined)

    const base: NormalizedError = {
      statusCode,
      code: (responseData?.code as string | undefined) ?? axiosError.code,
      details: responseData ?? axiosError.toJSON?.() ?? undefined,
      isNetworkError: !axiosError.response && !!axiosError.request,
      userMessage: "",
    }

    // Friendly, specific messages by status code
    switch (statusCode) {
      case 400:
        base.userMessage = apiMessage || "Solicitud inválida. Revisa los datos enviados."
        break
      case 401:
        base.userMessage = apiMessage || "Tu sesión no es válida. Inicia sesión nuevamente."
        break
      case 403:
        base.userMessage = apiMessage || "No tienes permisos para realizar esta acción."
        break
      case 404:
        base.userMessage = apiMessage || "Recurso no encontrado."
        break
      case 409:
        base.userMessage = apiMessage || "Conflicto con el estado actual."
        break
      case 422:
        base.userMessage = apiMessage || "Datos inválidos. Verifica los campos."
        break
      case 429:
        base.userMessage = apiMessage || "Demasiadas solicitudes. Intenta más tarde."
        break
      case 500:
        base.userMessage = apiMessage || "Error del servidor. Intenta nuevamente más tarde."
        break
      default:
        if (base.isNetworkError) {
          base.userMessage =
            "No hay conexión con el servidor. Verifica tu internet e inténtalo de nuevo."
        } else {
          base.userMessage = apiMessage || "Ocurrió un error inesperado."
        }
    }

    return base
  }

  // Non-Axios unexpected error
  return {
    userMessage: "Ocurrió un error inesperado.",
    details: error,
  }
}



