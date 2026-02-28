import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"

/**
 * Hook para invitar usuarios a una tienda (POST /auth/store/:storeId/invite).
 * Listo para usar; aún no está conectado a la UI. Cuando se implemente el flujo
 * de "Invitar usuario" en la página de cuentas/permisos (/accounts-permissions),
 * importar este hook ahí y usarlo en el formulario de invitación.
 */

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
