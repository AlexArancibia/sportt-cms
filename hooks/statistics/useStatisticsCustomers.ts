import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { buildDateParams } from "@/lib/dateHelpers"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { CustomerStats } from "@/types/statistics"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsCustomers(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): Promise<CustomerStats> {
  const params = buildDateParams(startDate, endDate, currencyId)
  const url = `/statistics/${storeId}/customers${params ? `?${params}` : ""}`
  const response = await apiClient.get<CustomerStats>(url)
  return extractApiData(response)
}

export function useStatisticsCustomers(
  storeId: string | null,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.statistics.customers(safeStoreId, startDate, endDate, currencyId),
    queryFn: () => fetchStatisticsCustomers(storeId!, startDate, endDate, currencyId),
    enabled: !!storeId && enabled,
  })
}
