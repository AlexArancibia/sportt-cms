import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ProductStats } from "@/stores/statisticsStore"

// Helper to build query params - format dates as YYYY-MM-DD
function buildDateParams(startDate?: Date, endDate?: Date, currencyId?: string): string {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
  if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))
  if (currencyId) params.append("currencyId", currencyId)
  return params.toString()
}

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
  currencyId?: string
) {
  return useQuery({
    queryKey: queryKeys.statistics.products(storeId!, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsProducts(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
