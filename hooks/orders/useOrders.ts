import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData, extractPaginatedData } from "@/lib/apiHelpers"
import type { Order } from "@/types/order"

export interface NextOrderNumberResponse {
  nextOrderNumber: number
}

export interface OrderSearchParams {
  page?: number
  limit?: number
  query?: string
  financialStatus?: string
  fulfillmentStatus?: string
  paymentStatus?: string
  shippingStatus?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: string
}

export interface OrdersResponse {
  data: Order[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext?: boolean
    hasPrev?: boolean
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
}

/**
 * Fetch orders by store. Exported for use in CSV export and other callers that need to fetch without React Query.
 */
export async function fetchOrdersByStore(
  storeId: string,
  params?: OrderSearchParams
): Promise<OrdersResponse> {
  const queryParams: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  }
  if (params?.query) queryParams.query = params.query
  if (params?.financialStatus) queryParams.financialStatus = params.financialStatus
  if (params?.fulfillmentStatus) queryParams.fulfillmentStatus = params.fulfillmentStatus
  if (params?.paymentStatus) queryParams.paymentStatus = params.paymentStatus
  if (params?.shippingStatus) queryParams.shippingStatus = params.shippingStatus
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortOrder) queryParams.sortOrder = params.sortOrder

  const response = await apiClient.get<Order[]>(`/orders/${storeId}`, {
    params: queryParams,
  })
  const { data, pagination } = extractPaginatedData<Order[]>(response)
  return {
    data,
    meta: {
      page: pagination?.page ?? 1,
      limit: pagination?.limit ?? 20,
      total: pagination?.total ?? 0,
      totalPages: pagination?.totalPages ?? 1,
      hasNext: pagination?.hasNext ?? pagination?.hasNextPage,
      hasPrev: pagination?.hasPrev ?? pagination?.hasPrevPage,
      hasNextPage: pagination?.hasNextPage ?? pagination?.hasNext,
      hasPrevPage: pagination?.hasPrevPage ?? pagination?.hasPrev,
    },
  }
}

/**
 * Fetches the next order number for a store (GET /orders/:storeId/next-order-number).
 * Cached by React Query; invalidate after creating an order.
 */
export async function fetchNextOrderNumber(
  storeId: string
): Promise<NextOrderNumberResponse> {
  const response = await apiClient.get(`/orders/${storeId}/next-order-number`)
  const data = extractApiData(response) as NextOrderNumberResponse
  const next = data?.nextOrderNumber
  return {
    nextOrderNumber:
      typeof next === "number" && Number.isFinite(next) ? next : 1000,
  }
}

export function useNextOrderNumber(
  storeId: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.orders.nextOrderNumber(storeId ?? "__none__"),
    queryFn: () => fetchNextOrderNumber(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 0,
  })
}

export function useOrders(
  storeId: string | null,
  params?: OrderSearchParams,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.orders.byStore(safeStoreId, {
      page: params?.page,
      limit: params?.limit,
      query: params?.query,
      financialStatus: params?.financialStatus,
      fulfillmentStatus: params?.fulfillmentStatus,
      paymentStatus: params?.paymentStatus,
      shippingStatus: params?.shippingStatus,
      startDate: params?.startDate,
      endDate: params?.endDate,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    }),
    queryFn: () => fetchOrdersByStore(storeId!, params),
    enabled: !!storeId && enabled,
  })
}
