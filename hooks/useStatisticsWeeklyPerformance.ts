import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type {
  WeeklyPerformanceData,
  WeeklyPerformanceResponse,
} from "@/stores/statisticsStore"

// Helper to build query params - format dates as YYYY-MM-DD
function buildDateParams(startDate?: Date, endDate?: Date, currencyId?: string): string {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
  if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))
  if (currencyId) params.append("currencyId", currencyId)
  return params.toString()
}

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsWeeklyPerformance(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): Promise<WeeklyPerformanceData[]> {
  const params = buildDateParams(startDate, endDate, currencyId)
  const url = `/statistics/${storeId}/weekly${params ? `?${params}` : ""}`
  const response = await apiClient.get<WeeklyPerformanceResponse>(url)
  const responseData = extractApiData(response) as unknown as WeeklyPerformanceResponse
  return responseData.data
}

export function useStatisticsWeeklyPerformance(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.statistics.weeklyPerformance(storeId!, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsWeeklyPerformance(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
