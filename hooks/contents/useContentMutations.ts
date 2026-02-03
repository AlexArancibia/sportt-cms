import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type {
  Content,
  CreateContentDto,
  UpdateContentDto,
} from "@/types/content"

async function createContentAPI(
  storeId: string,
  data: CreateContentDto
): Promise<Content> {
  const { storeId: _omit, ...body } = data
  const response = await apiClient.post<Content>(`/contents/${storeId}`, body)
  return extractApiData(response)
}

/** Omite campos vacíos que el backend rechaza (FK / validación). */
function sanitizeUpdatePayload(data: UpdateContentDto): UpdateContentDto {
  const omitIfEmpty = (v: unknown, key: string) =>
    (key === "authorId" || key === "category") && (v == null || v === "")
  return Object.fromEntries(
    (Object.entries(data) as [keyof UpdateContentDto, unknown][]).filter(
      ([k, v]) => v !== undefined && !omitIfEmpty(v, k)
    )
  ) as UpdateContentDto
}

async function updateContentAPI(
  storeId: string,
  id: string,
  data: UpdateContentDto
): Promise<Content> {
  const body = sanitizeUpdatePayload(data)
  const response = await apiClient.put<Content>(
    `/contents/${storeId}/${id}`,
    body
  )
  return extractApiData(response)
}

async function deleteContentAPI(
  storeId: string,
  id: string
): Promise<void> {
  await apiClient.delete(`/contents/${storeId}/${id}`)
}

export function useContentMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateContents = (targetStoreId?: string) => {
    const id = targetStoreId ?? storeId
    if (!id) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.contents.byStore(id),
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateContentDto) => {
      if (!storeId) throw new Error("No store selected")
      return createContentAPI(storeId, data)
    },
    onSuccess: () => invalidateContents(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      storeId: targetStoreId,
    }: {
      id: string
      data: UpdateContentDto
      storeId?: string
    }) => {
      const sid = targetStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return updateContentAPI(sid, id, data)
    },
    onSuccess: (_, variables) => {
      invalidateContents(variables.storeId)
      const sid = variables.storeId ?? storeId
      if (sid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.contents.byId(sid, variables.id),
        })
      }
    },
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
      return deleteContentAPI(sid, id)
    },
    onSuccess: (_, variables) => {
      invalidateContents(variables.storeId)
    },
  })

  return {
    createContent: createMutation.mutateAsync,
    updateContent: updateMutation.mutateAsync,
    deleteContent: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
