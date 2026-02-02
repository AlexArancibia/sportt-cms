import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { CardSection } from "@/types/card"
import type {
  CreateCardSectionPayload,
  UpdateCardSectionPayload,
} from "@/types/card"

async function createCardSectionByStore(
  storeId: string,
  data: CreateCardSectionPayload
): Promise<CardSection> {
  const response = await apiClient.post<CardSection>(`/card-section/${storeId}`, data)
  return extractApiData(response)
}

async function updateCardSectionByStore(
  storeId: string,
  sectionId: string,
  data: UpdateCardSectionPayload
): Promise<CardSection> {
  const response = await apiClient.patch<CardSection>(
    `/card-section/${storeId}/${sectionId}`,
    data
  )
  return extractApiData(response)
}

async function deleteCardSectionByStore(
  storeId: string,
  sectionId: string
): Promise<void> {
  await apiClient.delete(`/card-section/${storeId}/${sectionId}`)
}

export function useCardSectionMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateCardSections = () => {
    if (!storeId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.cardSections.byStore(storeId) })
  }

  const createCardSection = useMutation({
    mutationFn: async (data: CreateCardSectionPayload) => {
      if (!storeId) throw new Error("No store selected")
      return createCardSectionByStore(storeId, data)
    },
    onSuccess: invalidateCardSections,
  })

  const updateCardSection = useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: { sectionId: string; data: UpdateCardSectionPayload }) => {
      if (!storeId) throw new Error("No store selected")
      return updateCardSectionByStore(storeId, sectionId, data)
    },
    onSuccess: (_, { sectionId }) => {
      invalidateCardSections()
      void queryClient.invalidateQueries({
        queryKey: queryKeys.cardSections.byId(storeId!, sectionId),
      })
    },
  })

  const deleteCardSection = useMutation({
    mutationFn: async (sectionId: string) => {
      if (!storeId) throw new Error("No store selected")
      return deleteCardSectionByStore(storeId, sectionId)
    },
    onSuccess: invalidateCardSections,
  })

  return { createCardSection, updateCardSection, deleteCardSection }
}
