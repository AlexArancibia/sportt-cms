import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { CardSection } from "@/types/card"

/** Fetch card sections by store. Exported for imperative refetch (e.g. CSV export). */
export async function fetchCardSectionsByStore(storeId: string): Promise<CardSection[]> {
  const response = await apiClient.get<CardSection[]>(`/card-section/${storeId}`)
  const data = extractApiData(response)
  return Array.isArray(data) ? data : []
}

export function useCardSections(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.cardSections.byStore(safeStoreId),
    queryFn: () => fetchCardSectionsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  })
}
