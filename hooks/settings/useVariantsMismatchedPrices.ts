import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"

export interface MismatchedVariantPrice {
  currencyId: string
  currencyCode: string
  symbol: string
  price: number
  originalPrice: number | null
  expectedPrice: number
  expectedOriginalPrice: number | null
}

export interface MismatchedVariant {
  id: string
  title: string
  sku: string | null
  product: { id: string; title: string }
  prices: MismatchedVariantPrice[]
}

export interface VariantsMismatchedPricesResponse {
  count: number
  page: number
  limit: number
  totalPages: number
  variants: MismatchedVariant[]
}

async function fetchVariantsMismatchedPrices(
  storeId: string,
  page: number,
  limit: number
): Promise<VariantsMismatchedPricesResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", String(limit))
  const response = await apiClient.get<VariantsMismatchedPricesResponse>(
    `/products/${storeId}/variants-mismatched-prices?${params.toString()}`
  )
  return extractApiData(response)
}

export function useVariantsMismatchedPrices(
  storeId: string | null,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.variantsMismatchedPrices.byStore(safeStoreId, page, limit),
    queryFn: () => fetchVariantsMismatchedPrices(storeId!, page, limit),
    enabled: !!storeId && enabled,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useAdjustPricesByExchangeRates(storeId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (baseCurrencyId: string) => {
      const response = await apiClient.post(
        `/products/${storeId}/adjust-prices`,
        { baseCurrencyId }
      )
      return extractApiData(response)
    },
    onSuccess: () => {
      if (storeId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.variantsMismatchedPrices.allForStore(storeId),
        })
    },
  })
}
