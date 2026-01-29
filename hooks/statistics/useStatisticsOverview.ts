import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { buildDateParams } from "@/lib/dateHelpers"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { OverviewStats } from "@/types/statistics"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsOverview(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): Promise<OverviewStats> {
  const params = buildDateParams(startDate, endDate, currencyId)
  const url = `/statistics/${storeId}/overview${params ? `?${params}` : ""}`
  const response = await apiClient.get<OverviewStats>(url)
  return extractApiData(response)
}

export function useStatisticsOverview(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.statistics.overview(safeStoreId, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsOverview(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
  })
}
