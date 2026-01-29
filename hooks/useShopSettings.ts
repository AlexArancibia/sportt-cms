import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { ShopSettings } from "@/types/store"

// Función estable fuera del componente para evitar cambios de referencia
async function fetchShopSettingsByStore(storeId: string): Promise<ShopSettings> {
  const response = await apiClient.get<ShopSettings>(`/shop-settings/${storeId}`)
  const shopSettings = extractApiData(response)
  
  // Normalizar: el backend puede devolver array o objeto único
  const normalizedSettings = Array.isArray(shopSettings) ? shopSettings : [shopSettings]
  const filteredSettings = normalizedSettings.filter((setting) => setting.storeId === storeId)
  
  if (filteredSettings.length === 0) {
    throw new Error("Shop settings do not belong to the specified store")
  }
  
  return filteredSettings[0]
}

export function useShopSettings(storeId: string | null) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.shopSettings.byStore(safeStoreId),
    queryFn: () => fetchShopSettingsByStore(storeId!),
    enabled: !!storeId, // Solo ejecuta si hay storeId
    staleTime: 30 * 60_000, // 30 minutos (shop settings cambia poco, igual que currencies)
    gcTime: 60 * 60_000, // 60 minutos (mantener en cache más tiempo, igual que currencies)
  })
}
