import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import { Country, State, City } from "@/types/shippingMethod"

type GeographicStore = {
  countries: Country[]
  states: Record<string, State[]>
  cities: Record<string, City[]>
  fetchCountries: () => Promise<Country[]>
  fetchStates: (countryId: string) => Promise<State[]>
  fetchCities: (countryId: string, stateId: string) => Promise<City[]>
}

const pickArray = <T,>(data: any, expectedType: string): T[] => {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]

  if (Array.isArray(data.data)) return data.data as T[]
  if (data.type === expectedType && Array.isArray(data.data)) return data.data as T[]
  if (Array.isArray(data[expectedType])) return data[expectedType] as T[]

  return []
}

export const useGeographicDataStore = create<GeographicStore>((set, get) => ({
  countries: [],
  states: {},
  cities: {},
  async fetchCountries() {
    const { countries } = get()
    if (countries.length) {
      return countries
    }

    const response = await apiClient.get("/shipping-methods/geographic-data")
    const countryList = pickArray<Country>(response?.data?.data, "countries")

    set({ countries: countryList })
    return countryList
  },
  async fetchStates(countryId: string) {
    const { states } = get()
    if (states[countryId]?.length) {
      return states[countryId]
    }

    const response = await apiClient.get(`/shipping-methods/geographic-data/${countryId}`)
    const stateList = pickArray<State>(response?.data?.data, "states")

    set((current) => ({
      states: {
        ...current.states,
        [countryId]: stateList,
      },
    }))

    return stateList
  },
  async fetchCities(countryId: string, stateId: string) {
    const { cities } = get()
    if (cities[stateId]?.length) {
      return cities[stateId]
    }

    const response = await apiClient.get(`/shipping-methods/geographic-data/${countryId}/${stateId}`)
    const cityList = pickArray<City>(response?.data?.data, "cities")

    set((current) => ({
      cities: {
        ...current.cities,
        [stateId]: cityList,
      },
    }))

    return cityList
  },
}))

