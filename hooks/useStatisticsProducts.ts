import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { buildDateParams } from "@/lib/dateHelpers"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ProductStats } from "@/types/statistics"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsProducts(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): Promise<ProductStats> {
  const params = buildDateParams(startDate, endDate, currencyId)
  const url = `/statistics/${storeId}/products${params ? `?${params}` : ""}`
  const response = await apiClient.get<ProductStats>(url)
  return extractApiData(response)
}

export function useStatisticsProducts(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.statistics.products(safeStoreId, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsProducts(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
  })
}
