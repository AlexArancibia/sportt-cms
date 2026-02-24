import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { TeamSection } from "@/types/team"

async function fetchTeamSectionById(storeId: string, sectionId: string): Promise<TeamSection> {
  const response = await apiClient.get<TeamSection>(`/team-sections/${storeId}/${sectionId}`)
  return extractApiData(response)
}

export function useTeamSectionById(
  storeId: string | null,
  sectionId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeSectionId = sectionId ?? "__none__"

  return useQuery({
    queryKey: queryKeys.teamSections.byId(`${safeStoreId}:${safeSectionId}`),
    queryFn: () => fetchTeamSectionById(storeId!, sectionId!),
    enabled: !!storeId && !!sectionId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export { fetchTeamSectionById }
