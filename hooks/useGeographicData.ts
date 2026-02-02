import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type { Country } from "@/types/shippingMethod"

function pickArray<T>(data: unknown, expectedType: string): T[] {
  if (!data || typeof data !== "object") return []
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as T[]
  if (obj.type === expectedType && Array.isArray(obj.data)) return obj.data as T[]
  if (Array.isArray(obj[expectedType])) return obj[expectedType] as T[]
  return []
}

async function fetchCountriesFromApi(): Promise<Country[]> {
  const response = await apiClient.get("/shipping-methods/geographic-data")
  const body = response?.data as unknown
  const inner = body && typeof body === "object" && "data" in body ? (body as { data: unknown }).data : body
  const countryList = pickArray<Country>(inner, "countries")
  return countryList
}

/**
 * Countries list for shipping (one request, deduped by React Query).
 */
export function useCountries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.geographic.countries(),
    queryFn: fetchCountriesFromApi,
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
  })
}
