import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"

export interface StoreRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}

interface StoreRolesApiResponse {
  data?: StoreRole[]
}

async function fetchStoreRoles(storeId: string | null): Promise<StoreRole[]> {
  if (!storeId) return []
  const response = await apiClient.get<StoreRolesApiResponse>(`/auth/store/${storeId}/roles`)
  const raw = response.data?.data ?? response.data
  return Array.isArray(raw) ? raw : []
}

export function useStoreRoles(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.storeRoles.byStore(storeId ?? ""),
    queryFn: () => fetchStoreRoles(storeId),
    enabled: !!storeId,
  })
}
