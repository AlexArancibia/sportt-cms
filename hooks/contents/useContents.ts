import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { Content } from "@/types/content"

async function fetchContentsByStore(storeId: string): Promise<Content[]> {
  const response = await apiClient.get<Content[]>(`/contents/${storeId}`)
  const { data } = extractPaginatedData<Content[]>(response)
  return Array.isArray(data) ? data : []
}

export function useContents(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.contents.byStore(safeStoreId),
    queryFn: () => fetchContentsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
