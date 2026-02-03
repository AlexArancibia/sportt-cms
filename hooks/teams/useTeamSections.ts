import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { TeamSection } from "@/types/team"

async function fetchTeamSectionsByStore(storeId: string): Promise<TeamSection[]> {
  const response = await apiClient.get<TeamSection[]>(`/team-sections/${storeId}`)
  const data = extractApiData(response)
  return Array.isArray(data) ? data : []
}

export function useTeamSections(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.teamSections.byStore(safeStoreId),
    queryFn: () => fetchTeamSectionsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}

export { fetchTeamSectionsByStore }
