import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { CreateStoreRolePayload } from "./useCreateStoreRole"

interface UpdateStoreRolePayload extends CreateStoreRolePayload {
  roleId: string
}

async function updateStoreRoleApi(
  storeId: string,
  roleId: string,
  payload: Omit<CreateStoreRolePayload, "name"> & { name?: string }
) {
  const res = await apiClient.patch(
    `/auth/store/${storeId}/roles/${roleId}`,
    payload
  )
  return extractApiData(res)
}

export function useUpdateStoreRole(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, ...payload }: UpdateStoreRolePayload) => {
      if (!storeId) throw new Error("Store ID is required")
      return updateStoreRoleApi(storeId, roleId, payload)
    },
    onSuccess: (_, variables) => {
      if (storeId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.storeRoles.byStore(storeId),
        })
        void queryClient.invalidateQueries({
          queryKey: [...queryKeys.storeRoles.byStore(storeId), "detail", variables.roleId],
        })
      }
    },
  })
}
