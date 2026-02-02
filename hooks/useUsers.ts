import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { User } from "@/types/user"

async function fetchUsersByStore(storeId: string): Promise<User[]> {
  const response = await apiClient.get<User[]>(`/auth/store/${storeId}`)
  const users = extractApiData(response)
  return Array.isArray(users) ? users : [users]
}

export function useUsers(storeId: string | null, enabled = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.users.byStore(safeStoreId),
    queryFn: () => fetchUsersByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
