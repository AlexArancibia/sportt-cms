import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/category"

async function createCategoryAPI(
  storeId: string,
  data: CreateCategoryDto
): Promise<Category> {
  const response = await apiClient.post<Category>(`/categories/${storeId}`, data)
  return extractApiData(response)
}

async function updateCategoryAPI(
  storeId: string,
  id: string,
  data: UpdateCategoryDto
): Promise<Category> {
  const response = await apiClient.put<Category>(
    `/categories/${storeId}/${id}`,
    data
  )
  return extractApiData(response)
}

async function deleteCategoryRecursively(
  storeId: string,
  id: string,
  flatCategories: Category[]
): Promise<void> {
  const children = flatCategories.filter((c) => c.parentId === id)
  for (const child of children) {
    await deleteCategoryRecursively(storeId, child.id, flatCategories)
  }
  await apiClient.delete(`/categories/${storeId}/${id}`)
}

export function useCategoryMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateCategories = () => {
    if (!storeId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories.byStore(storeId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.categorySlugs.byStore(storeId) })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => {
      if (!storeId) throw new Error("No store selected")
      return createCategoryAPI(storeId, data)
    },
    onSuccess: invalidateCategories,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateCategoryDto
    }) => {
      if (!storeId) throw new Error("No store selected")
      return updateCategoryAPI(storeId, id, data)
    },
    onSuccess: invalidateCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      flatCategories,
    }: {
      id: string
      flatCategories: Category[]
    }) => {
      if (!storeId) throw new Error("No store selected")
      return deleteCategoryRecursively(storeId, id, flatCategories)
    },
    onSuccess: invalidateCategories,
  })

  return {
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
