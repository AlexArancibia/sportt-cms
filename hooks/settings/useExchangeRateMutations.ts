import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ExchangeRate } from "@/types/exchangeRate"

async function createExchangeRate(data: {
  fromCurrencyId: string
  toCurrencyId: string
  rate: number
  effectiveDate: string
}): Promise<ExchangeRate> {
  const response = await apiClient.post<ExchangeRate>("/exchange-rates", data)
  return extractApiData(response)
}

async function updateExchangeRate(
  id: string,
  data: { rate?: number; effectiveDate?: string }
): Promise<ExchangeRate> {
  const response = await apiClient.put<ExchangeRate>(`/exchange-rates/${id}`, data)
  return extractApiData(response)
}

export function useExchangeRateMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRates.all() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rate?: number; effectiveDate?: string } }) =>
      updateExchangeRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRates.all() })
    },
  })

  return {
    createExchangeRate: createMutation.mutateAsync,
    updateExchangeRate: (id: string, data: { rate?: number; effectiveDate?: string }) =>
      updateMutation.mutateAsync({ id, data }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
