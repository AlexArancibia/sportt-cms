import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import { queryKeys } from "@/lib/queryKeys"
import type { Customer } from "@/types/customer"
import type { CreateCustomerDto, UpdateCustomerDto } from "@/types/customer"

async function createCustomerApi(customer: CreateCustomerDto): Promise<Customer> {
  const res = await apiClient.post<Customer>("/customers", customer)
  return extractApiData(res)
}

async function updateCustomerApi(id: string, data: UpdateCustomerDto): Promise<Customer> {
  const res = await apiClient.put<Customer>(`/customers/${id}`, data)
  return extractApiData(res)
}

export function useCustomerMutations(storeId?: string | null) {
  const qc = useQueryClient()

  const invalidateCustomers = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.customers.all() })
    if (storeId) void qc.invalidateQueries({ queryKey: queryKeys.customers.byStore(storeId) })
  }

  const createCustomer = useMutation({
    mutationFn: createCustomerApi,
    onSuccess: invalidateCustomers,
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto }) => updateCustomerApi(id, data),
    onSuccess: invalidateCustomers,
  })

  return { createCustomer, updateCustomer }
}
