import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { TeamSection } from "@/types/team"

async function fetchTeamSectionById(sectionId: string): Promise<TeamSection> {
  const response = await apiClient.get<TeamSection>(`/team-sections/${sectionId}`)
  return extractApiData(response)
}

export function useTeamSectionById(
  sectionId: string | null,
  enabled: boolean = true
) {
  const safeSectionId = sectionId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.teamSections.byId(safeSectionId),
    queryFn: () => fetchTeamSectionById(sectionId!),
    enabled: !!sectionId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export { fetchTeamSectionById }
