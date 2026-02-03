import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Product } from "@/types/product"

async function createProductByStore(storeId: string, payload: Record<string, unknown>): Promise<Product> {
  const response = await apiClient.post<Product>(`/products/${storeId}`, payload)
  return extractApiData(response)
}

export function useCreateProduct(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!storeId) throw new Error("No store selected")
      return createProductByStore(storeId, payload)
    },
    onSuccess: async () => {
      if (!storeId) return
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.byStore(storeId) })
    },
  })
}
