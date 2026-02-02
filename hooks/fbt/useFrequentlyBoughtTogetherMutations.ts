import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type {
  FrequentlyBoughtTogether,
  CreateFrequentlyBoughtTogetherDto,
  UpdateFrequentlyBoughtTogetherDto,
} from "@/types/fbt"

async function createFBT(storeId: string, data: CreateFrequentlyBoughtTogetherDto): Promise<FrequentlyBoughtTogether> {
  const response = await apiClient.post<FrequentlyBoughtTogether>(`/fbt/${storeId}`, data)
  return extractApiData(response)
}

async function updateFBT(
  storeId: string,
  id: string,
  data: UpdateFrequentlyBoughtTogetherDto
): Promise<FrequentlyBoughtTogether> {
  const response = await apiClient.patch<FrequentlyBoughtTogether>(`/fbt/${storeId}/${id}`, data)
  return extractApiData(response)
}

async function deleteFBT(storeId: string, id: string): Promise<void> {
  await apiClient.delete(`/fbt/${storeId}/${id}`)
}

export function useFrequentlyBoughtTogetherMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateFbt = () => {
    if (!storeId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.fbt.byStore(storeId) })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateFrequentlyBoughtTogetherDto) => {
      if (!storeId) throw new Error("No store selected")
      return createFBT(storeId, data)
    },
    onSuccess: invalidateFbt,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFrequentlyBoughtTogetherDto }) => {
      if (!storeId) throw new Error("No store selected")
      return updateFBT(storeId, id, data)
    },
    onSuccess: (_, { id }) => {
      invalidateFbt()
      void queryClient.invalidateQueries({ queryKey: queryKeys.fbt.byId(storeId!, id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!storeId) throw new Error("No store selected")
      return deleteFBT(storeId, id)
    },
    onSuccess: invalidateFbt,
  })

  return {
    createFrequentlyBoughtTogether: createMutation.mutateAsync,
    updateFrequentlyBoughtTogether: updateMutation.mutateAsync,
    deleteFrequentlyBoughtTogether: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
