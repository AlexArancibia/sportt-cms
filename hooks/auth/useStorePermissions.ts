import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"

export interface StorePermissionsResponse {
  permissions: string[]
  isOwner?: boolean
}

async function fetchStorePermissions(
  storeId: string | null
): Promise<StorePermissionsResponse> {
  if (!storeId) return { permissions: [], isOwner: false }
  const response = await apiClient.get<StorePermissionsResponse>(
    `/auth/store/${storeId}/my-permissions`
  )
  const raw = (response.data as any)?.data ?? response.data
  if (raw && typeof raw === "object" && Array.isArray((raw as StorePermissionsResponse).permissions)) {
    return raw as StorePermissionsResponse
  }
  return { permissions: [], isOwner: false }
}

export function useStorePermissions(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.storePermissions.byStore(storeId ?? ""),
    queryFn: () => fetchStorePermissions(storeId),
    enabled: !!storeId,
  })
}

/** Helper: true if user has the given permission (or has all via "*"). */
export function hasPermission(
  data: StorePermissionsResponse | undefined,
  permission: string
): boolean {
  if (!data?.permissions?.length) return false
  if (data.permissions.includes("*")) return true
  return data.permissions.includes(permission)
}
