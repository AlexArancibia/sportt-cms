import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type {
  TeamSection,
  CreateTeamSectionDto,
  UpdateTeamSectionDto,
} from "@/types/team"

async function createTeamSectionAPI(data: CreateTeamSectionDto): Promise<TeamSection> {
  const storeId = data.storeId
  if (!storeId) throw new Error("No store ID provided")
  const dataWithStore: CreateTeamSectionDto = { ...data, storeId }
  const response = await apiClient.post<TeamSection>("/team-sections", dataWithStore)
  return extractApiData(response)
}

async function updateTeamSectionAPI(
  id: string,
  data: UpdateTeamSectionDto
): Promise<TeamSection> {
  const response = await apiClient.patch<TeamSection>(`/team-sections/${id}`, data)
  return extractApiData(response)
}

async function deleteTeamSectionAPI(id: string): Promise<void> {
  await apiClient.delete(`/team-sections/${id}`)
}

export function useTeamSectionMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateTeamSections = (targetStoreId?: string) => {
    const id = targetStoreId ?? storeId
    if (!id) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.teamSections.byStore(id),
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateTeamSectionDto) => createTeamSectionAPI(data),
    onSuccess: (_, variables) => {
      if (variables.storeId) invalidateTeamSections(variables.storeId)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamSectionDto }) =>
      updateTeamSectionAPI(id, data),
    onSuccess: (updated) => {
      invalidateTeamSections(updated.storeId)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teamSections.byId(updated.id),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeamSectionAPI(id),
    onSuccess: () => invalidateTeamSections(),
  })

  return {
    createTeamSection: createMutation.mutateAsync,
    updateTeamSection: updateMutation.mutateAsync,
    deleteTeamSection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
