import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { Content } from "@/types/content"

async function fetchContentById(
  storeId: string,
  contentId: string
): Promise<Content> {
  const response = await apiClient.get<Content>(
    `/contents/${storeId}/${contentId}`
  )
  return extractApiData(response)
}

export function useContentById(
  storeId: string | null,
  contentId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeContentId = contentId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.contents.byId(safeStoreId, safeContentId),
    queryFn: () => fetchContentById(storeId!, contentId!),
    enabled: !!storeId && !!contentId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
