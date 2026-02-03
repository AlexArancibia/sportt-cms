import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type {
  ShopSettings,
  CreateShopSettingsDto,
  UpdateShopSettingsDto,
} from "@/types/store"

async function createShopSettings(dto: CreateShopSettingsDto): Promise<ShopSettings> {
  const response = await apiClient.post<ShopSettings>("/shop-settings", dto)
  return extractApiData(response)
}

async function updateShopSettings(
  id: string,
  storeId: string,
  dto: UpdateShopSettingsDto
): Promise<ShopSettings> {
  const response = await apiClient.patch<ShopSettings>(`/shop-settings/${storeId}`, dto)
  return extractApiData(response)
}

async function addAcceptedCurrency(
  shopId: string,
  storeId: string,
  currencyId: string
): Promise<ShopSettings> {
  const response = await apiClient.post<ShopSettings>(
    `/shop-settings/${storeId}/currencies/${currencyId}`
  )
  return extractApiData(response)
}

async function removeAcceptedCurrency(
  shopId: string,
  storeId: string,
  currencyId: string
): Promise<ShopSettings> {
  const response = await apiClient.delete<ShopSettings>(
    `/shop-settings/${storeId}/currencies/${currencyId}`
  )
  return extractApiData(response)
}

export function useShopSettingsMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createShopSettings,
    onSuccess: (data) => {
      const sid = data?.storeId ?? storeId
      if (sid) queryClient.invalidateQueries({ queryKey: queryKeys.shopSettings.byStore(sid) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      storeId: sid,
      dto,
    }: {
      id: string
      storeId: string
      dto: UpdateShopSettingsDto
    }) => updateShopSettings(id, sid, dto),
    onSuccess: (_, { storeId: sid }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopSettings.byStore(sid) })
    },
  })

  const addCurrencyMutation = useMutation({
    mutationFn: ({
      shopId,
      storeId: sid,
      currencyId,
    }: {
      shopId: string
      storeId: string
      currencyId: string
    }) => addAcceptedCurrency(shopId, sid, currencyId),
    onSuccess: (_, { storeId: sid }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopSettings.byStore(sid) })
    },
  })

  const removeCurrencyMutation = useMutation({
    mutationFn: ({
      shopId,
      storeId: sid,
      currencyId,
    }: {
      shopId: string
      storeId: string
      currencyId: string
    }) => removeAcceptedCurrency(shopId, sid, currencyId),
    onSuccess: (_, { storeId: sid }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shopSettings.byStore(sid) })
    },
  })

  return {
    createShopSettings: createMutation.mutateAsync,
    updateShopSettings: (id: string, dto: UpdateShopSettingsDto) => {
      if (!storeId) throw new Error("No store ID provided")
      return updateMutation.mutateAsync({ id, storeId, dto })
    },
    addAcceptedCurrency: (shopId: string, currencyId: string) => {
      if (!storeId) throw new Error("No store ID provided")
      return addCurrencyMutation.mutateAsync({ shopId, storeId, currencyId })
    },
    removeAcceptedCurrency: (shopId: string, currencyId: string) => {
      if (!storeId) throw new Error("No store ID provided")
      return removeCurrencyMutation.mutateAsync({ shopId, storeId, currencyId })
    },
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      addCurrencyMutation.isPending ||
      removeCurrencyMutation.isPending,
  }
}
