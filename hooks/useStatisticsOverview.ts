import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { OverviewStats } from "@/stores/statisticsStore"

// Helper to build query params - format dates as YYYY-MM-DD
function buildDateParams(startDate?: Date, endDate?: Date, currencyId?: string): string {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
  if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))
  if (currencyId) params.append("currencyId", currencyId)
  return params.toString()
}

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
  return useQuery({
    queryKey: queryKeys.statistics.overview(storeId!, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsOverview(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled, // Solo ejecuta si hay storeId y enabled es true
    staleTime: 30_000, // 30 segundos (igual que el default del provider)
    gcTime: 5 * 60_000, // 5 minutos (igual que el default del provider)
  })
}
