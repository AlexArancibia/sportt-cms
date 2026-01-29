import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Product } from "@/types/product"

async function fetchProductById(storeId: string, productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${storeId}/${productId}`)
  return extractApiData(response)
}

export function useProductById(storeId: string | null, productId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey:
      storeId && productId ? queryKeys.product.byId(storeId, productId) : (["product", storeId, productId] as const),
    queryFn: () => fetchProductById(storeId!, productId!),
    enabled: !!storeId && !!productId && enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

