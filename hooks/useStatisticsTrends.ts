import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { TrendsStats } from "@/stores/statisticsStore"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsTrends(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  groupBy: string = "day",
  currencyId?: string
): Promise<TrendsStats> {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
  if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))
  if (currencyId) params.append("currencyId", currencyId)
  params.append("groupBy", groupBy.toLowerCase())
  const url = `/statistics/${storeId}/trends?${params.toString()}`
  const response = await apiClient.get(url)
  return extractApiData(response) as TrendsStats
}

export function useStatisticsTrends(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  groupBy: string = "day",
  currencyId?: string
) {
  return useQuery({
    queryKey: queryKeys.statistics.trends(storeId!, startDate, endDate, groupBy, currencyId),
    queryFn: () => fetchStatisticsTrends(storeId!, startDate, endDate, groupBy, currencyId),
    enabled: !!storeId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
