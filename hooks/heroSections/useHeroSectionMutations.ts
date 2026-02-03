import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type {
  HeroSection,
  CreateHeroSectionDto,
  UpdateHeroSectionDto,
} from "@/types/heroSection"

/** Convierte strings vacíos de URLs de media a undefined para el API. */
function cleanMediaUrls<
  T extends CreateHeroSectionDto | UpdateHeroSectionDto,
>(data: T): T {
  return {
    ...data,
    backgroundImage: data.backgroundImage || undefined,
    mobileBackgroundImage: data.mobileBackgroundImage || undefined,
    backgroundVideo: data.backgroundVideo || undefined,
    mobileBackgroundVideo: data.mobileBackgroundVideo || undefined,
  }
}

async function createHeroSectionAPI(
  storeId: string,
  data: CreateHeroSectionDto
): Promise<HeroSection> {
  const response = await apiClient.post<HeroSection>(
    `/hero-sections/${storeId}`,
    cleanMediaUrls(data)
  )
  return extractApiData(response)
}

async function updateHeroSectionAPI(
  storeId: string,
  id: string,
  data: UpdateHeroSectionDto
): Promise<HeroSection> {
  const response = await apiClient.put<HeroSection>(
    `/hero-sections/${storeId}/${id}`,
    cleanMediaUrls(data)
  )
  return extractApiData(response)
}

async function deleteHeroSectionAPI(storeId: string, id: string): Promise<void> {
  await apiClient.delete(`/hero-sections/${storeId}/${id}`)
}

export function useHeroSectionMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidate = (storeIdToInvalidate?: string) => {
    const id = storeIdToInvalidate ?? storeId
    if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.heroSections.byStore(id) })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateHeroSectionDto) => {
      if (!storeId) throw new Error("No store selected")
      return createHeroSectionAPI(storeId, data)
    },
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      storeId: targetStoreId,
    }: {
      id: string
      data: UpdateHeroSectionDto
      storeId?: string
    }) => {
      const sid = targetStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return updateHeroSectionAPI(sid, id, data)
    },
    onSuccess: (_, variables) => {
      invalidate(variables.storeId)
      const sid = variables.storeId ?? storeId
      if (sid)
        void queryClient.invalidateQueries({
          queryKey: queryKeys.heroSections.byId(sid, variables.id),
        })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      storeId: targetStoreId,
      heroSectionStoreId,
    }: {
      id: string
      storeId?: string
      heroSectionStoreId?: string
    }) => {
      const sid = targetStoreId ?? heroSectionStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return deleteHeroSectionAPI(sid, id)
    },
    onSuccess: (_, variables) => {
      invalidate(variables.storeId ?? variables.heroSectionStoreId)
    },
  })

  return {
    createHeroSection: createMutation.mutateAsync,
    updateHeroSection: updateMutation.mutateAsync,
    deleteHeroSection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
