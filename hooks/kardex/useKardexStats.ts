import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { KardexFilters, CurrencyValue } from "@/types/kardex"

export interface KardexStatsData {
  totalProducts: number
  totalValuesByCurrency: CurrencyValue[]
  lowStock: number
  movements: number
}

function buildStatsParams(filters?: KardexFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (!filters) return params
  if (filters.startDate) params.append("startDate", filters.startDate)
  if (filters.endDate) params.append("endDate", filters.endDate)
  if (filters.search) params.append("query", filters.search)
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

async function fetchKardexStats(
  storeId: string,
  filters?: KardexFilters
): Promise<KardexStatsData> {
  const params = buildStatsParams(filters)
  const queryString = params.toString()
  const url = `/kardex/${storeId}/stats${queryString ? `?${queryString}` : ""}`
  const response = await apiClient.get<KardexStatsData>(url)
  const data = extractApiData(response)
  return (
    data ?? {
      totalProducts: 0,
      totalValuesByCurrency: [],
      lowStock: 0,
      movements: 0,
    }
  )
}

export function useKardexStats(
  storeId: string | null,
  filters?: KardexFilters,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.kardex.stats(safeStoreId, {
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      query: filters?.search,
      category: filters?.category,
      movementType: filters?.movementType,
      currency: filters?.currency,
    }),
    queryFn: () => fetchKardexStats(storeId!, filters),
    enabled: !!storeId && enabled,
    staleTime: 30 * 1000,
  })
}
