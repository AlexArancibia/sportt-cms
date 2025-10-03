import { PaginationParams, PaginatedResponse } from '@/types/pagination';

// Función helper para construir query string de paginación
export function buildPaginationQuery(params: PaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  
  return searchParams;
}

// Función helper para construir query string completa (paginación + filtros específicos)
export function buildFullQuery( 
  pagination: PaginationParams,
  filters: Record<string, any> = {}
): URLSearchParams {
  const searchParams = buildPaginationQuery(pagination);
  
  // Agregar filtros específicos
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item.toString()));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });
  
  return searchParams;
}

// Función para formatear URL con paginación
export function buildPaginatedUrl(
  baseUrl: string, 
  pagination: PaginationParams,
  filters: Record<string, any> = {}
): string {
  const queryString = buildFullQuery(pagination, filters);
  return queryString.toString() ? `${baseUrl}?${queryString}` : baseUrl;
}

// Función para hacer fetch paginado
export async function fetchPaginatedData<T>(
  baseUrl: string,
  params: PaginationParams,
  filters: Record<string, any> = {},
  apiClient: any
): Promise<PaginatedResponse<T>> {
  const url = buildPaginatedUrl(baseUrl, params, filters);
  const response = await apiClient.get(url);
  
  // Formatear respuesta según la estructura esperada
  return {
    data: response.data.data || response.data.items || response.data,
    pagination: {
      page: params.page || 1,
      limit: params.limit || 20,
      total: response.data.total || response.data.count || 0,
      totalPages: response.data.totalPages || response.data.pages || 0,
      hasNext: response.data.hasNext || response.data.pagination?.hasNext || false,
      hasPrev: response.data.hasPrev || response.data.pagination?.hasPrev || false
    }
  };
}

// Templates de configuración por recurso
export const resourceConfigs = {
  products: {
    baseUrl: '/products/store', 
    defaultSort: 'createdAt',
    defaultOrder: 'desc' as const,
    searchFields: ['query', 'status', 'vendor', 'categoryIds', 'collectionIds']
  },
  collections: {
    baseUrl: '/collections',
    defaultSort: 'createdAt', 
    defaultOrder: 'desc' as const,
    searchFields: ['query', 'includeInactive']
  },
  contents: {
    baseUrl: '/contents',
    defaultSort: 'createdAt',
    defaultOrder: 'desc' as const,
    searchFields: ['query', 'type', 'category', 'published']
  },
  orders: {
    baseUrl: '/orders',
    defaultSort: 'createdAt',
    defaultOrder: 'desc' as const,
    searchFields: ['financialStatus', 'fulfillmentStatus', 'paymentStatus', 'shippingStatus', 'startDate', 'endDate']
  },
  coupons: {
    baseUrl: '/coupons',
    defaultSort: 'createdAt',
    defaultOrder: 'desc' as const,
    searchFields: ['query', 'includeInactive']
  }
} as const;

// Función específica para crear fetch por recurso
export function createFetchByResource(
  storeId: string,
  resource: keyof typeof resourceConfigs,
  apiClient: any
) {
  return async function<T>(
    pagination: PaginationParams,
    filters: Record<string, any> = {}
  ): Promise<PaginatedResponse<T>> {
    const config = resourceConfigs[resource];
    const baseUrl = `${config.baseUrl}/${storeId}`;
    
    return fetchPaginatedData(baseUrl, pagination, filters, apiClient);
  };
}
