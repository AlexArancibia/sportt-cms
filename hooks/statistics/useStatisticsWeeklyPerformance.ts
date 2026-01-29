import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { buildDateParams } from "@/lib/dateHelpers"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type {
  WeeklyPerformanceData,
  WeeklyPerformanceResponse,
} from "@/types/statistics"

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
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.statistics.weeklyPerformance(safeStoreId, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsWeeklyPerformance(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
  })
}
