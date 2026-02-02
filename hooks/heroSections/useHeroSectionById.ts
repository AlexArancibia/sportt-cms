import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { HeroSection } from "@/types/heroSection"

async function fetchHeroSection(storeId: string, id: string): Promise<HeroSection> {
  const response = await apiClient.get<HeroSection>(`/hero-sections/${storeId}/${id}`)
  return extractApiData(response)
}

export function useHeroSectionById(
  storeId: string | null,
  heroSectionId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.heroSections.byId(safeStoreId, heroSectionId ?? "__none__"),
    queryFn: () => fetchHeroSection(storeId!, heroSectionId!),
    enabled: !!storeId && !!heroSectionId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
