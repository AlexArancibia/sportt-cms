import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

export interface StoreRoleWithPermissions {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: { resource: string; actions: string[] }[]
}

async function fetchStoreRoleById(
  storeId: string | null,
  roleId: string | null
): Promise<StoreRoleWithPermissions | null> {
  if (!storeId || !roleId) return null
  const response = await apiClient.get<StoreRoleWithPermissions>(
    `/auth/store/${storeId}/roles/${roleId}`
  )
  return extractApiData(response) as StoreRoleWithPermissions
}

export function useStoreRoleById(
  storeId: string | null,
  roleId: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...queryKeys.storeRoles.byStore(storeId ?? ""), "detail", roleId],
    queryFn: () => fetchStoreRoleById(storeId, roleId),
    enabled: !!storeId && !!roleId && enabled,
  })
}
