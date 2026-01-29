import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { queryKeys } from "@/lib/queryKeys"
import { ProductStatus } from "@/types/common"

async function deleteProductByStore(storeId: string, productId: string) {
  await apiClient.delete(`/products/${storeId}/${productId}`)
}

async function setProductStatusByStore(storeId: string, productId: string, status: ProductStatus) {
  await apiClient.patch(`/products/${storeId}/${productId}/status`, { status })
}

export function useProductMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateProducts = async () => {
    if (!storeId) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.byStore(storeId) })
  }

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      if (!storeId) throw new Error("No store selected")
      return deleteProductByStore(storeId, productId)
    },
    onSuccess: invalidateProducts,
  })

  const archiveProduct = useMutation({
    mutationFn: async (productId: string) => {
      if (!storeId) throw new Error("No store selected")
      return setProductStatusByStore(storeId, productId, ProductStatus.ARCHIVED)
    },
    onSuccess: invalidateProducts,
  })

  const unarchiveProduct = useMutation({
    mutationFn: async (productId: string) => {
      if (!storeId) throw new Error("No store selected")
      return setProductStatusByStore(storeId, productId, ProductStatus.ACTIVE)
    },
    onSuccess: invalidateProducts,
  })

  return { deleteProduct, archiveProduct, unarchiveProduct }
}
