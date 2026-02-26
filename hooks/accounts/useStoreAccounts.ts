import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"

export interface StoreAccountRole {
  id: string
  name: string
}

export interface StoreAccount {
  id: string
  userId: string
  isActive: boolean
  invitedAt: string
  joinedAt: string | null
  isOwner: boolean
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
  roles: StoreAccountRole[]
}

interface StoreAccountsApiResponse {
  data?: StoreAccount[]
}

async function fetchStoreAccounts(storeId: string | null): Promise<StoreAccount[]> {
  if (!storeId) return []
  const response = await apiClient.get<StoreAccountsApiResponse>(`/auth/store/${storeId}/accounts`)
  const raw = response.data?.data ?? response.data
  return Array.isArray(raw) ? raw : []
}

export function useStoreAccounts(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.storeAccounts.byStore(storeId ?? ""),
    queryFn: () => fetchStoreAccounts(storeId),
    enabled: !!storeId,
  })
}
