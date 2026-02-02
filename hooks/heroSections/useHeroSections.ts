import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { HeroSection } from "@/types/heroSection"

async function fetchHeroSectionsByStore(storeId: string): Promise<HeroSection[]> {
  const response = await apiClient.get<HeroSection[]>(`/hero-sections/${storeId}`)
  const { data } = extractPaginatedData<HeroSection[]>(response)
  return Array.isArray(data) ? data : []
}

export function useHeroSections(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.heroSections.byStore(safeStoreId),
    queryFn: () => fetchHeroSectionsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
