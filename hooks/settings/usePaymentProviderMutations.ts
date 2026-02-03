import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { PaymentProvider } from "@/types/payments"

async function createPaymentProvider(
  storeId: string,
  data: Omit<Record<string, unknown>, "storeId">
): Promise<PaymentProvider> {
  const response = await apiClient.post<PaymentProvider>(`/payment-providers/${storeId}`, data)
  return extractApiData(response)
}

async function updatePaymentProvider(
  storeId: string,
  id: string,
  data: Record<string, unknown>
): Promise<PaymentProvider> {
  const response = await apiClient.put<PaymentProvider>(
    `/payment-providers/${storeId}/${id}`,
    data
  )
  return extractApiData(response)
}

async function deletePaymentProvider(id: string): Promise<void> {
  await apiClient.delete(`/payment-providers/${id}`)
}

export function usePaymentProviderMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    if (storeId) queryClient.invalidateQueries({ queryKey: queryKeys.paymentProviders.byStore(storeId) })
  }

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createPaymentProvider>[1]) => {
      if (!storeId) throw new Error("No store ID provided")
      return createPaymentProvider(storeId, data)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      if (!storeId) throw new Error("No store ID provided")
      return updatePaymentProvider(storeId, id, data)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePaymentProvider,
    onSuccess: invalidate,
  })

  return {
    createPaymentProvider: createMutation.mutateAsync,
    updatePaymentProvider: (id: string, data: Record<string, unknown>) =>
      updateMutation.mutateAsync({ id, data }),
    deletePaymentProvider: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
