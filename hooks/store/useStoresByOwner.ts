import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { Store } from "@/types/store"

async function fetchStoresByOwner(ownerId: string): Promise<Store[]> {
  const response = await apiClient.get<Store[]>(`/stores/owner/${ownerId}`)
  const { data } = extractPaginatedData<Store[]>(response)
  return data
}

export function useStoresByOwner(ownerId: string | null) {
  return useQuery({
    queryKey: queryKeys.stores.byOwner(ownerId ?? ""),
    queryFn: () => fetchStoresByOwner(ownerId!),
    enabled: !!ownerId,
    staleTime: 5 * 60_000, // 5 minutos
    gcTime: 10 * 60_000,
  })
}
