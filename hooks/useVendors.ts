import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchVendorsByStore(storeId: string): Promise<string[]> {
  const response = await apiClient.get(`/products/${storeId}/vendors`)
  const vendors = extractApiData<string[]>(response)
  return Array.isArray(vendors) ? vendors : []
}

export function useVendors(storeId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.vendors.byStore(storeId!),
    queryFn: () => fetchVendorsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000, // cambia poco
    gcTime: 60 * 60_000,
  })
}

