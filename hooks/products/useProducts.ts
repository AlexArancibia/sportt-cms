import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { PaginatedProductsResponse, ProductSearchParams } from "@/types/product"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchProductsByStore(
  storeId: string,
  params?: ProductSearchParams
): Promise<PaginatedProductsResponse> {
  // Construir query params igual que en el store
  const queryParams = new URLSearchParams()
  queryParams.append('page', String(params?.page || 1))
  queryParams.append('limit', String(params?.limit || 20))
  queryParams.append('sortBy', params?.sortBy || 'createdAt')
  queryParams.append('sortOrder', params?.sortOrder || 'desc')
  
  if (params?.query) queryParams.append('query', params.query)
  
  // Vendor como array
  if (params?.vendor && params.vendor.length > 0) {
    params.vendor.forEach(v => queryParams.append('vendor', v))
  }
  
  if (params?.minPrice !== undefined) queryParams.append('minPrice', String(params.minPrice))
  if (params?.maxPrice !== undefined) queryParams.append('maxPrice', String(params.maxPrice))
  if (params?.currencyId) queryParams.append('currencyId', params.currencyId)
  
  // Arrays
  params?.status?.forEach(s => queryParams.append('status', s))
  params?.categorySlugs?.forEach(slug => queryParams.append('categorySlugs', slug))
  params?.collectionIds?.forEach(id => queryParams.append('collectionIds', id))
  
  const url = `/products/${storeId}?${queryParams.toString()}`
  const response = await apiClient.get<PaginatedProductsResponse>(url)
  
  // Validar respuesta
  if (!response.data?.data || !response.data?.pagination) {
    throw new Error('Invalid API response structure')
  }
  
  return response.data
}

export function useProducts(
  storeId: string | null,
  params?: ProductSearchParams,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.products.byStore(safeStoreId, {
      page: params?.page,
      limit: params?.limit,
      query: params?.query,
      vendor: params?.vendor,
      categorySlugs: params?.categorySlugs,
      status: params?.status,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    }),
    queryFn: () => fetchProductsByStore(storeId!, params),
    enabled: !!storeId && enabled,
  })
}
