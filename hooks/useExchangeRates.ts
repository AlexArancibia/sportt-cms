import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { ExchangeRate } from "@/types/exchangeRate"

async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const response = await apiClient.get<ExchangeRate[]>("/exchange-rates")
  const { data } = extractPaginatedData<ExchangeRate[]>(response)
  return Array.isArray(data) ? data : []
}

export function useExchangeRates() {
  return useQuery({
    queryKey: queryKeys.exchangeRates.all(),
    queryFn: fetchExchangeRates,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  })
}

