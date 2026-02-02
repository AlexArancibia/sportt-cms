import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { Order } from "@/types/order"

/** Fetch single order by id. Exported for prefetch/ensureQueryData in OrderForm. */
export async function fetchOrderById(storeId: string, orderId: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/orders/${storeId}/${orderId}`)
  return extractApiData(response)
}

export function useOrderById(
  storeId: string | null,
  orderId: string | null,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  const safeOrderId = orderId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.order.byId(safeStoreId, safeOrderId),
    queryFn: () => fetchOrderById(storeId!, orderId!),
    enabled: !!storeId && !!orderId && enabled,
  })
}
