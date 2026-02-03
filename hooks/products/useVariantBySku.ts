import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ProductVariant } from "@/types/productVariant"

/** Variant con product incluido (para búsqueda por código de barras) */
export interface VariantWithProduct extends ProductVariant {
  product?: import("@/types/product").Product
}

async function fetchVariantBySku(
  storeId: string,
  sku: string
): Promise<VariantWithProduct> {
  const response = await apiClient.get<VariantWithProduct>(
    `/products/${storeId}/variants/by-sku/${encodeURIComponent(sku)}`
  )
  return extractApiData(response)
}

export function useVariantBySku(
  storeId: string | null,
  sku: string | null,
  enabled = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeSku = sku ?? "__none__"
  return useQuery({
    queryKey: queryKeys.variant.bySku(safeStoreId, safeSku),
    queryFn: () => fetchVariantBySku(storeId!, sku!),
    enabled: !!storeId && !!sku && sku.trim().length > 0 && enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  })
}
