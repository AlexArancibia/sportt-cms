import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { FrequentlyBoughtTogether } from "@/types/fbt"

async function fetchFrequentlyBoughtTogetherById(
  storeId: string,
  fbtId: string
): Promise<FrequentlyBoughtTogether> {
  const response = await apiClient.get<FrequentlyBoughtTogether>(`/fbt/${storeId}/${fbtId}`)
  return extractApiData(response)
}

export function useFrequentlyBoughtTogetherById(
  storeId: string | null,
  fbtId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeFbtId = fbtId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.fbt.byId(safeStoreId, safeFbtId),
    queryFn: () => fetchFrequentlyBoughtTogetherById(storeId!, fbtId!),
    enabled: !!storeId && !!fbtId && enabled,
    staleTime: 5 * 60_000, // 5 min
    gcTime: 30 * 60_000, // 30 min
  })
}
