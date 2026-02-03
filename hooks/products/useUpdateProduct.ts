import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { queryKeys } from "@/lib/queryKeys"

type UpdateProductArgs = {
  storeId: string
  productId: string
  payload: Record<string, unknown>
}

async function updateProductByStore({ storeId, productId, payload }: UpdateProductArgs) {
  // QuickEdit envía un payload parcial (solo cambios).
  // Endpoint usado por el store: PATCH /products/{storeId}/{id}
  await apiClient.patch(`/products/${storeId}/${productId}`, payload)
}

export function useUpdateProduct(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: { productId: string; payload: Record<string, unknown> }) => {
      if (!storeId) throw new Error("No store selected")
      return updateProductByStore({ storeId, productId: args.productId, payload: args.payload })
    },
    onSuccess: async (_data, variables) => {
      if (!storeId) return
      // Refrescar listas de productos (todas las combinaciones de filtros/page)
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.byStore(storeId) })
      // Refrescar detalle del producto
      await queryClient.invalidateQueries({ queryKey: queryKeys.product.byId(storeId, variables.productId) })
    },
  })
}
