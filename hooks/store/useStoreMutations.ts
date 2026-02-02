import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { Store, UpdateStoreDto } from "@/types/store"

async function updateStore(id: string, data: UpdateStoreDto): Promise<Store> {
  const response = await apiClient.patch<Store>(`/stores/${id}`, data)
  return extractApiData(response)
}

export function useStoreMutations(ownerId: string | null) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreDto }) =>
      updateStore(id, data),
    onSuccess: (_, variables) => {
      if (ownerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.stores.byOwner(ownerId) })
      }
    },
  })

  return {
    updateStore: (id: string, data: UpdateStoreDto) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
  }
}
