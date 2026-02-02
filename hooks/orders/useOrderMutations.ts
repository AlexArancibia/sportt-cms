import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Order } from "@/types/order"
import type { CreateOrderDto, CreateRefundDto, UpdateOrderDto } from "@/types/order"

// API functions - storeId va en la URL del path, no en el body
async function createOrderByStore(storeId: string, data: CreateOrderDto): Promise<Order> {
  const response = await apiClient.post<Order>(`/orders/${storeId}`, data)
  return extractApiData(response)
}

async function updateOrderByStore(storeId: string, orderId: string, data: UpdateOrderDto): Promise<Order> {
  const response = await apiClient.put<Order>(`/orders/${storeId}/${orderId}`, data)
  return extractApiData(response)
}

async function deleteOrderByStore(storeId: string, orderId: string): Promise<void> {
  await apiClient.delete(`/orders/${storeId}/${orderId}`)
}

async function createRefundApi(data: CreateRefundDto): Promise<void> {
  await apiClient.post("/refunds", data)
}

export function useOrderMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateOrders = () => {
    if (!storeId) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.byStore(storeId) })
  }

  const invalidateNextOrderNumber = () => {
    if (!storeId) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.orders.nextOrderNumber(storeId),
    })
  }

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderDto) => {
      if (!storeId) throw new Error("No store selected")
      return createOrderByStore(storeId, data)
    },
    onSuccess: () => {
      invalidateOrders()
      invalidateNextOrderNumber()
    },
  })

  const updateOrder = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: UpdateOrderDto }) => {
      if (!storeId) throw new Error("No store selected")
      return updateOrderByStore(storeId, orderId, data)
    },
    onSuccess: (_, { orderId }) => {
      invalidateOrders()
      void queryClient.invalidateQueries({ queryKey: queryKeys.order.byId(storeId!, orderId) })
    },
  })

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      if (!storeId) throw new Error("No store selected")
      return deleteOrderByStore(storeId, orderId)
    },
    onSuccess: invalidateOrders,
  })

  const createRefund = useMutation({
    mutationFn: createRefundApi,
    onSuccess: (_, variables) => {
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.order.byId(storeId, variables.orderId) })
        invalidateOrders()
      }
    },
  })

  return { createOrder, updateOrder, deleteOrder, createRefund }
}
