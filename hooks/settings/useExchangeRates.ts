import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { ExchangeRate } from "@/types/exchangeRate"

async function fetchExchangeRates(latestPerPair?: boolean): Promise<ExchangeRate[]> {
  const response = await apiClient.get<ExchangeRate[]>("/exchange-rates", {
    params: {
      limit: 100,
      sortBy: "effectiveDate",
      sortOrder: "desc",
      ...(latestPerPair && { latestPerPair: true }),
    },
  })
  const { data } = extractPaginatedData<ExchangeRate[]>(response)
  return Array.isArray(data) ? data : []
}

export function useExchangeRates(options?: { latestPerPair?: boolean }) {
  const latestPerPair = options?.latestPerPair === true
  return useQuery({
    queryKey: latestPerPair ? queryKeys.exchangeRates.latestPerPair() : queryKeys.exchangeRates.all(),
    queryFn: () => fetchExchangeRates(latestPerPair),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  })
}
