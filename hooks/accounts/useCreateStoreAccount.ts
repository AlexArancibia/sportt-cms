import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

export interface CreateEmployeePayload {
  email: string
  firstName: string
  lastName: string
  password: string
  phone?: string
  roleIds: string[]
}

async function createStoreAccountApi(storeId: string, payload: CreateEmployeePayload) {
  const res = await apiClient.post(`/auth/store/${storeId}/accounts`, payload)
  return extractApiData(res)
}

export function useCreateStoreAccount(storeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => {
      if (!storeId) throw new Error("Store ID is required")
      return createStoreAccountApi(storeId, payload)
    },
    onSuccess: () => {
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.storeAccounts.byStore(storeId) })
      }
    },
  })
}
