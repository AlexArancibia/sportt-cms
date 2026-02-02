import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Coupon, CreateCouponDto, UpdateCouponDto } from "@/types/coupon"

async function createCouponAPI(storeId: string, data: CreateCouponDto): Promise<Coupon> {
  const { storeId: _s, ...payload } = data as CreateCouponDto & { storeId?: string }
  const response = await apiClient.post<Coupon>(`/coupons/${storeId}`, payload)
  return extractApiData(response)
}

async function updateCouponAPI(
  storeId: string,
  id: string,
  data: UpdateCouponDto
): Promise<Coupon> {
  const { storeId: _s, ...payload } = data as UpdateCouponDto & { storeId?: string }
  const response = await apiClient.put<Coupon>(`/coupons/${storeId}/${id}`, payload)
  return extractApiData(response)
}

async function deleteCouponAPI(storeId: string, id: string): Promise<void> {
  await apiClient.delete(`/coupons/${storeId}/${id}`)
}

export function useCouponMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidateCoupons = (targetStoreId?: string) => {
    const id = targetStoreId ?? storeId
    if (!id) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.coupons.byStore(id),
    })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCouponDto) => {
      if (!storeId) throw new Error("No store selected")
      const targetStoreId = data.storeId || storeId
      return createCouponAPI(targetStoreId, data)
    },
    onSuccess: () => invalidateCoupons(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      storeId: targetStoreId,
    }: {
      id: string
      data: UpdateCouponDto & { storeId?: string }
      storeId?: string
    }) => {
      const sid = targetStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return updateCouponAPI(sid, id, data)
    },
    onSuccess: (_, variables) => {
      invalidateCoupons(variables.storeId)
      const sid = variables.storeId ?? storeId
      if (sid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.coupons.byId(sid, variables.id),
        })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      storeId: targetStoreId,
      couponStoreId,
    }: {
      id: string
      storeId?: string
      couponStoreId?: string
    }) => {
      const sid = targetStoreId ?? couponStoreId ?? storeId
      if (!sid) throw new Error("No store selected")
      return deleteCouponAPI(sid, id)
    },
    onSuccess: (_, variables) => {
      invalidateCoupons(variables.storeId ?? variables.couponStoreId)
    },
  })

  return {
    createCoupon: createMutation.mutateAsync,
    updateCoupon: updateMutation.mutateAsync,
    deleteCoupon: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
