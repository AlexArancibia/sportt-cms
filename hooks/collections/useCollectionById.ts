import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { Collection } from "@/types/collection"

async function fetchCollectionById(
  storeId: string,
  collectionId: string
): Promise<Collection> {
  const response = await apiClient.get<Collection>(
    `/collections/${storeId}/${collectionId}`
  )
  return extractApiData(response)
}

export function useCollectionById(
  storeId: string | null,
  collectionId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeCollectionId = collectionId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.collections.byId(safeStoreId, safeCollectionId),
    queryFn: () => fetchCollectionById(storeId!, collectionId!),
    enabled: !!storeId && !!collectionId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
