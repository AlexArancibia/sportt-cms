import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

export interface UpdateStoreAccountPayload {
  isActive?: boolean
  roleIds?: string[]
}

async function updateStoreAccountApi(
  storeId: string,
  storeUserId: string,
  payload: UpdateStoreAccountPayload
) {
  const res = await apiClient.patch(
    `/auth/store/${storeId}/accounts/${storeUserId}`,
    payload
  )
  return extractApiData(res)
}

export function useUpdateStoreAccount(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeUserId,
      payload,
    }: {
      storeUserId: string
      payload: UpdateStoreAccountPayload
    }) => {
      if (!storeId) throw new Error("Store ID is required")
      return updateStoreAccountApi(storeId, storeUserId, payload)
    },
    onSuccess: () => {
      if (storeId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.storeAccounts.byStore(storeId),
        })
      }
    },
  })
}
