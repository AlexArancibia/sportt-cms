import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { ExchangeRate } from "@/types/exchangeRate"

async function fetchExchangeRates(
  storeId: string | null,
  latestPerPair?: boolean
): Promise<ExchangeRate[]> {
  if (!storeId) return []

  const response = await apiClient.get<ExchangeRate[]>(`/exchange-rates/${storeId}`, {
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

export function useExchangeRates(options?: { latestPerPair?: boolean; storeId?: string | null }) {
  const latestPerPair = options?.latestPerPair === true
  const storeId = options?.storeId ?? null

  return useQuery({
    queryKey: latestPerPair
      ? queryKeys.exchangeRates.latestPerPair(storeId)
      : queryKeys.exchangeRates.all(storeId),
    queryFn: () => fetchExchangeRates(storeId, latestPerPair),
    enabled: !!storeId,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  })
}
