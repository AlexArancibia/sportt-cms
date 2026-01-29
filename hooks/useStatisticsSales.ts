import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { buildDateParams } from "@/lib/dateHelpers"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { SalesStats } from "@/types/statistics"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsSales(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): Promise<SalesStats> {
  const params = buildDateParams(startDate, endDate, currencyId)
  const url = `/statistics/${storeId}/sales${params ? `?${params}` : ""}`
  const response = await apiClient.get<SalesStats>(url)
  return extractApiData(response)
}

export function useStatisticsSales(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.statistics.sales(safeStoreId, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsSales(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
  })
}
