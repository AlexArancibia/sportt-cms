import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractPaginatedData } from "@/lib/apiHelpers"
import type { Currency } from "@/types/currency"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchCurrencies(): Promise<Currency[]> {
  const response = await apiClient.get<Currency[]>(`/currencies`)
  const { data: currenciesData } = extractPaginatedData<Currency[]>(response)
  return currenciesData
}

export function useCurrencies() {
  return useQuery({
    queryKey: queryKeys.currencies.all(),
    queryFn: fetchCurrencies,
    staleTime: 30 * 60_000, // 30 minutos (currencies cambia poco)
    gcTime: 60 * 60_000, // 1 hora (mantener en cache más tiempo)
  })
}
