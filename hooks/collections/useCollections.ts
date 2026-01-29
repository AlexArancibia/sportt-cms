import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { Collection } from "@/types/collection"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchCollectionsByStore(storeId: string): Promise<Collection[]> {
  const response = await apiClient.get<Collection[]>(`/collections/${storeId}`)
  const { data } = extractPaginatedData<Collection[]>(response)
  return Array.isArray(data) ? data : []
}

export function useCollections(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.collections.byStore(safeStoreId),
    queryFn: () => fetchCollectionsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
