import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { Coupon } from "@/types/coupon"

async function fetchCouponsByStore(storeId: string): Promise<Coupon[]> {
  const response = await apiClient.get<Coupon[]>(`/coupons/${storeId}`)
  const { data } = extractPaginatedData<Coupon[]>(response)
  return Array.isArray(data) ? data : []
}

export function useCoupons(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.coupons.byStore(safeStoreId),
    queryFn: () => fetchCouponsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}
