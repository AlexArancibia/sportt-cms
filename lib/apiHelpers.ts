import { AxiosResponse } from 'axios';

/**
 * Interfaz para respuestas encapsuladas del backend
 */
export interface ApiResponse<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Interfaz para respuestas paginadas del backend
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Helper para extraer datos de respuestas del backend
 * El backend puede devolver datos encapsulados en { data: {...} } o directamente
 * Este helper maneja ambos casos automáticamente
 */
export function extractApiData<T>(response: AxiosResponse<ApiResponse<T> | T>): T {
  // Si la respuesta tiene la propiedad 'data' y es un objeto, extraer de ahí
  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in response.data &&
    response.data.data !== undefined
  ) {
    return response.data.data as T;
  }

  // Si no, asumir que los datos están directamente en response.data
  return response.data as T;
}

/**
 * Helper para extraer respuestas paginadas del backend
 */
export function extractPaginatedData<T>(
  response: AxiosResponse
): { data: T; pagination: any } {
  const responseData = response.data;

  // Si la respuesta tiene la estructura encapsulada con success/statusCode
  if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    'pagination' in responseData
  ) {
    return {
      data: responseData.data as T,
      pagination: responseData.pagination,
    };
  }

  // Si los datos vienen directamente como { data, pagination }
  if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    'pagination' in responseData
  ) {
    return responseData as { data: T; pagination: any };
  }

  // Fallback: asumir que no hay paginación
  return {
    data: responseData as T,
    pagination: {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

