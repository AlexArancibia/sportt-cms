import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type { Country, State, City } from "@/types/shippingMethod"

function pickArray<T>(data: unknown, expectedType: string): T[] {
  if (!data || typeof data !== "object") return []
  const obj = data as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as T[]
  if (obj.type === expectedType && Array.isArray(obj.data)) return obj.data as T[]
  if (Array.isArray(obj[expectedType])) return obj[expectedType] as T[]
  return []
}

function getResponseData(body: unknown): unknown {
  return body && typeof body === "object" && "data" in body
    ? (body as { data: unknown }).data
    : body
}

async function fetchCountriesFromApi(): Promise<Country[]> {
  const res = await apiClient.get("/shipping-methods/geographic-data")
  return pickArray<Country>(getResponseData(res?.data), "countries")
}

async function fetchStatesFromApi(countryId: string): Promise<State[]> {
  const res = await apiClient.get(`/shipping-methods/geographic-data/${countryId}`)
  return pickArray<State>(getResponseData(res?.data), "states")
}

async function fetchCitiesFromApi(countryId: string, stateId: string): Promise<City[]> {
  const res = await apiClient.get(`/shipping-methods/geographic-data/${countryId}/${stateId}`)
  return pickArray<City>(getResponseData(res?.data), "cities")
}

const GEO_STALE_MS = 60 * 60_000
const GEO_GC_MS = 24 * 60 * 60_000

/**
 * Countries list for shipping (one request, deduped by React Query).
 */
export function useCountries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.geographic.countries(),
    queryFn: fetchCountriesFromApi,
    enabled,
    staleTime: GEO_STALE_MS,
    gcTime: GEO_GC_MS,
  })
}

/** States for a country (shipping zones). */
export function useStates(countryId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.geographic.states(countryId ?? ""),
    queryFn: () => fetchStatesFromApi(countryId!),
    enabled: !!countryId && enabled,
    staleTime: GEO_STALE_MS,
    gcTime: GEO_GC_MS,
  })
}

/** Cities for a state (shipping zones). */
export function useCities(countryId: string | null, stateId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.geographic.cities(countryId ?? "", stateId ?? ""),
    queryFn: () => fetchCitiesFromApi(countryId!, stateId!),
    enabled: !!countryId && !!stateId && enabled,
    staleTime: GEO_STALE_MS,
    gcTime: GEO_GC_MS,
  })
}
