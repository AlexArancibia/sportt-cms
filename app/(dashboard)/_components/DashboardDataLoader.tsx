"use client"

import { useAuthStore } from "@/stores/authStore"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useShopSettings } from "@/hooks/useShopSettings"

/** Suscribe a currencies y shop-settings en el layout; React Query deduplica y el resto lee de caché. */
export function DashboardDataLoader() {
  const currentStoreId = useAuthStore((s) => s.currentStoreId)
  useCurrencies()
  useShopSettings(currentStoreId)
  return null
}
