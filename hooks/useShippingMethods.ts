import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { ShippingMethod } from "@/types/shippingMethod"

async function fetchShippingMethodsByStore(storeId: string): Promise<ShippingMethod[]> {
  const response = await apiClient.get<ShippingMethod[]>(`/shipping-methods/${storeId}`)
  const { data } = extractPaginatedData<ShippingMethod[]>(response)
  return Array.isArray(data) ? data : []
}

export function useShippingMethods(storeId: string | null, enabled = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.shippingMethods.byStore(safeStoreId),
    queryFn: () => fetchShippingMethodsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
