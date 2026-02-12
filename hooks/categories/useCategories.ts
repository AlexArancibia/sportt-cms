import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type { CategorySearchParams, PaginatedCategoriesResponse } from "@/types/category"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchCategoriesByStore(
  storeId: string,
  params?: CategorySearchParams
): Promise<PaginatedCategoriesResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append("page", String(params?.page || 1))
  queryParams.append("limit", String(params?.limit || 20))
  queryParams.append("sortBy", params?.sortBy || "createdAt")
  queryParams.append("sortOrder", params?.sortOrder || "desc")

  if (params?.query) queryParams.append("query", params.query)
  if (params?.parentId) queryParams.append("parentId", params.parentId)
  if (params?.mode) queryParams.append("mode", params.mode)

  const url = `/categories/${storeId}?${queryParams.toString()}`
  const response = await apiClient.get<PaginatedCategoriesResponse>(url)

  if (!response.data?.data || !response.data?.pagination) {
    throw new Error("Invalid API response structure")
  }

  return response.data
}

export function useCategories(
  storeId: string | null,
  params?: CategorySearchParams,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.categories.byStore(safeStoreId, {
      page: params?.page,
      limit: params?.limit,
      query: params?.query,
      parentId: params?.parentId,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      mode: params?.mode,
    }),
    queryFn: () => fetchCategoriesByStore(storeId!, params),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
