import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ExchangeRate } from "@/types/exchangeRate"

async function createExchangeRate(
  storeId: string,
  data: {
    fromCurrencyId: string
    toCurrencyId: string
    rate: number
    effectiveDate: string
  }
): Promise<ExchangeRate> {
  const response = await apiClient.post<ExchangeRate>(`/exchange-rates/${storeId}`, data)
  return extractApiData(response)
}

async function updateExchangeRate(
  id: string,
  data: { rate?: number; effectiveDate?: string }
): Promise<ExchangeRate> {
  const response = await apiClient.put<ExchangeRate>(`/exchange-rates/${id}`, data)
  return extractApiData(response)
}

export function useExchangeRateMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateForStore = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRates.all(storeId ?? null) })
    queryClient.invalidateQueries({
      queryKey: queryKeys.exchangeRates.latestPerPair(storeId ?? null),
    })
    if (storeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.variantsMismatchedPrices.allForStore(storeId),
      })
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.variantsMismatchedPrices.all() })
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: {
      fromCurrencyId: string
      toCurrencyId: string
      rate: number
      effectiveDate: string
    }) => {
      if (!storeId) {
        return Promise.reject(new Error("StoreId is required to create exchange rate"))
      }
      return createExchangeRate(storeId, data)
    },
    onSuccess: invalidateForStore,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rate?: number; effectiveDate?: string } }) =>
      updateExchangeRate(id, data),
    onSuccess: invalidateForStore,
  })

  return {
    createExchangeRate: createMutation.mutateAsync,
    updateExchangeRate: (id: string, data: { rate?: number; effectiveDate?: string }) =>
      updateMutation.mutateAsync({ id, data }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
