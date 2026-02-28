import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

export interface RolePermissionItem {
  resource: string
  actions: string[]
}

export interface CreateStoreRolePayload {
  name: string
  description?: string
  permissions?: RolePermissionItem[]
}

async function createStoreRoleApi(
  storeId: string,
  payload: CreateStoreRolePayload
) {
  const res = await apiClient.post(
    `/auth/store/${storeId}/roles`,
    payload
  )
  return extractApiData(res)
}

export function useCreateStoreRole(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStoreRolePayload) => {
      if (!storeId) throw new Error("Store ID is required")
      return createStoreRoleApi(storeId, payload)
    },
    onSuccess: () => {
      if (storeId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.storeRoles.byStore(storeId),
        })
      }
    },
  })
}
