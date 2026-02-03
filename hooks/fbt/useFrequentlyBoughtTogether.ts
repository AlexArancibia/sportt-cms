import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { FrequentlyBoughtTogether } from "@/types/fbt"

async function fetchFrequentlyBoughtTogetherByStore(
  storeId: string
): Promise<FrequentlyBoughtTogether[]> {
  const response = await apiClient.get<FrequentlyBoughtTogether[]>(`/fbt/${storeId}`)
  const { data } = extractPaginatedData<FrequentlyBoughtTogether[]>(response)
  return Array.isArray(data) ? data : []
}

export function useFrequentlyBoughtTogether(
  storeId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.fbt.byStore(safeStoreId),
    queryFn: () => fetchFrequentlyBoughtTogetherByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000, // 10 min - combos cambian poco
    gcTime: 60 * 60_000, // 60 min
  })
}
