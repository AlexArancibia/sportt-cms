import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { InventoryStats } from "@/stores/statisticsStore"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchStatisticsInventory(
  storeId: string,
  currencyId?: string
): Promise<InventoryStats> {
  const params = new URLSearchParams()
  if (currencyId) params.append("currencyId", currencyId)
  const url = `/statistics/${storeId}/inventory${params.toString() ? `?${params.toString()}` : ""}`
  const response = await apiClient.get<InventoryStats>(url)
  return extractApiData(response)
}

export function useStatisticsInventory(storeId: string | null, currencyId?: string) {
  return useQuery({
    queryKey: queryKeys.statistics.inventory(storeId!, currencyId),
    queryFn: () => fetchStatisticsInventory(storeId!, currencyId),
    enabled: !!storeId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
