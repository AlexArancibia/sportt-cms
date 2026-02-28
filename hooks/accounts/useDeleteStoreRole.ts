import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

async function deleteStoreRoleApi(storeId: string, roleId: string) {
  const res = await apiClient.delete(`/auth/store/${storeId}/roles/${roleId}`)
  return extractApiData(res)
}

export function useDeleteStoreRole(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: string) => {
      if (!storeId) throw new Error("Store ID is required")
      return deleteStoreRoleApi(storeId, roleId)
    },
    onSuccess: () => {
      if (storeId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.storeRoles.byStore(storeId),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.storeAccounts.byStore(storeId),
        })
      }
    },
  })
}
