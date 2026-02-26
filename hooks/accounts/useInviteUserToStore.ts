import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

export interface InviteUserPayload {
  email: string
  roleIds?: string[]
}

async function inviteUserApi(storeId: string, payload: InviteUserPayload) {
  const res = await apiClient.post(`/auth/store/${storeId}/invite`, payload)
  return extractApiData(res)
}

export function useInviteUserToStore(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InviteUserPayload) => {
      if (!storeId) throw new Error("Store ID is required")
      return inviteUserApi(storeId, payload)
    },
    onSuccess: () => {
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.storeAccounts.byStore(storeId) })
      }
    },
  })
}
