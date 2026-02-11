import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type {
  Collection,
  CreateCollectionDto,
  UpdateCollectionDto,
} from "@/types/collection"

async function createCollectionAPI(
  storeId: string,
  data: CreateCollectionDto
): Promise<Collection> {
  const { storeId: _, ...dataWithoutStore } = data as CreateCollectionDto & {
    storeId?: string
  }
  const response = await apiClient.post<Collection>(
    `/collections/${storeId}`,
    dataWithoutStore
  )
  return extractApiData(response)
}

async function updateCollectionAPI(
  storeId: string,
  id: string,
  data: UpdateCollectionDto
): Promise<Collection> {
  const response = await apiClient.patch<Collection>(
    `/collections/${storeId}/${id}`,
    data
  )
  return extractApiData(response)
}

async function deleteCollectionAPI(
  storeId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/collections/${storeId}/${id}`)
}

export function useCollectionMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateCollections = (targetStoreId?: string) => {
    const id = targetStoreId ?? storeId
    if (!id) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.collections.byStore(id),
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCollectionDto) => {
      if (!storeId) throw new Error("No store selected")
      return createCollectionAPI(storeId, data)
    },
    onSuccess: () => invalidateCollections(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      storeId: targetStoreId,
    }: {
      id: string
      data: UpdateCollectionDto
      storeId?: string
    }) => {
      const sid = targetStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return updateCollectionAPI(sid, id, data)
    },
    // byStore invalidates list + detail (byId shares key prefix) → single refetch
    onSuccess: (_, variables) => invalidateCollections(variables.storeId),
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      storeId: targetStoreId,
    }: {
      id: string
      storeId?: string
    }) => {
      const sid = targetStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return deleteCollectionAPI(sid, id)
    },
    onSuccess: (_, variables) => {
      invalidateCollections(variables.storeId)
    },
  })

  return {
    createCollection: createMutation.mutateAsync,
    updateCollection: updateMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
