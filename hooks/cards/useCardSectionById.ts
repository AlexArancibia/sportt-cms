import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { CardSection } from "@/types/card"

/** Fetch single card section by id. Exported for prefetch/ensureQueryData. */
export async function fetchCardSection(
  storeId: string,
  sectionId: string
): Promise<CardSection> {
  const response = await apiClient.get<CardSection>(`/card-section/${storeId}/${sectionId}`)
  return extractApiData(response)
}

export function useCardSectionById(
  storeId: string | null,
  sectionId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeSectionId = sectionId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.cardSections.byId(safeStoreId, safeSectionId),
    queryFn: () => fetchCardSection(storeId!, sectionId!),
    enabled: !!storeId && !!sectionId && enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
