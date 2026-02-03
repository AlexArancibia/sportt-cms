import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type { KardexFilters, KardexResponse } from "@/types/kardex"

function buildKardexParams(filters?: KardexFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (!filters) return params
  if (filters.page) params.append("page", filters.page.toString())
  if (filters.limit) params.append("limit", filters.limit.toString())
  if (filters.startDate) params.append("startDate", filters.startDate)
  if (filters.endDate) params.append("endDate", filters.endDate)
  if (filters.search) params.append("query", filters.search)
  if (filters.sortBy) params.append("sortBy", filters.sortBy)
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)
  if (filters.category?.length) {
    filters.category.forEach((cat) => params.append("category", cat))
  }
  if (filters.movementType?.length) {
    filters.movementType.forEach((type) => params.append("movementType", type))
  }
  if (filters.currency?.length) {
    filters.currency.forEach((curr) => params.append("currency", curr))
  }
  return params
}

/**
 * Fetch kardex by store. Exported for callers that need to fetch without React Query.
 */
export async function fetchKardex(
  storeId: string,
  filters?: KardexFilters
): Promise<KardexResponse> {
  const params = buildKardexParams(filters)
  const queryString = params.toString()
  const url = `/kardex/${storeId}/general${queryString ? `?${queryString}` : ""}`
  const response = await apiClient.get<KardexResponse>(url)
  return response.data
}

export function useKardex(
  storeId: string | null,
  filters?: KardexFilters,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.kardex.general(safeStoreId, {
      page: filters?.page,
      limit: filters?.limit,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      query: filters?.search,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
      category: filters?.category,
      movementType: filters?.movementType,
      currency: filters?.currency,
    }),
    queryFn: () => fetchKardex(storeId!, filters),
    enabled: !!storeId && enabled,
    staleTime: 30 * 1000,
  })
}
