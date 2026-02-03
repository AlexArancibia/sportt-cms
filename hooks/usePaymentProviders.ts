import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { PaymentProvider } from "@/types/payments"

async function fetchPaymentProvidersByStore(storeId: string): Promise<PaymentProvider[]> {
  const response = await apiClient.get<PaymentProvider[]>(
    `/payment-providers/${storeId}?status=all`
  )
  const data = extractApiData(response)
  return Array.isArray(data) ? data : []
}

export function usePaymentProviders(storeId: string | null, enabled = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.paymentProviders.byStore(safeStoreId),
    queryFn: () => fetchPaymentProvidersByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
