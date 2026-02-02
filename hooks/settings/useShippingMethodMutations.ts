import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { CreateShippingMethodDto, ShippingMethod } from "@/types/shippingMethod"

const invalidate = (queryClient: QueryClient, storeId: string) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.shippingMethods.byStore(storeId) })

function stripStoreId(data: CreateShippingMethodDto & { storeId?: string }) {
  const { storeId: _s, ...payload } = data
  return payload
}

export function useShippingMethodMutations(storeId: string | null) {
  const queryClient = useQueryClient()
  const onSuccess = () => storeId && invalidate(queryClient, storeId)

  const createMutation = useMutation({
    mutationFn: (data: CreateShippingMethodDto) => {
      if (!storeId) throw new Error("No store ID provided")
      return apiClient.post<ShippingMethod>(`/shipping-methods/${storeId}`, stripStoreId(data)).then(extractApiData)
    },
    onSuccess,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateShippingMethodDto }) => {
      if (!storeId) throw new Error("No store ID provided")
      return apiClient.patch<ShippingMethod>(`/shipping-methods/${storeId}/${id}`, stripStoreId(data)).then(extractApiData)
    },
    onSuccess,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      if (!storeId) throw new Error("No store ID provided")
      return apiClient.delete(`/shipping-methods/${storeId}/${id}`)
    },
    onSuccess,
  })

  return {
    createShippingMethod: (data: CreateShippingMethodDto) => createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    updateShippingMethod: (id: string, data: CreateShippingMethodDto) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    deleteShippingMethod: (id: string) => deleteMutation.mutateAsync({ id }),
    isDeleting: deleteMutation.isPending,
  }
}
