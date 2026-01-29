import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type { PaginatedCategoriesResponse } from "@/types/category"

export type CategorySlugItem = { slug: string; name: string }

const CATEGORY_SLUGS_PAGE_SIZE = 100

// Función estable fuera del componente para evitar cambios de referencia
async function fetchCategorySlugsByStore(storeId: string): Promise<CategorySlugItem[]> {
  const queryParams = new URLSearchParams()
  queryParams.append("page", "1")
  queryParams.append("limit", String(CATEGORY_SLUGS_PAGE_SIZE))
  queryParams.append("sortBy", "createdAt")
  queryParams.append("sortOrder", "desc")

  const url = `/categories/${storeId}?${queryParams.toString()}`
  const response = await apiClient.get<PaginatedCategoriesResponse>(url)

  if (!response.data?.data) {
    throw new Error("Invalid API response structure")
  }

  return response.data.data.map((cat) => ({ slug: cat.slug, name: cat.name }))
}

export function useCategorySlugs(storeId: string | null, enabled: boolean = true) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.categorySlugs.byStore(safeStoreId),
    queryFn: () => fetchCategorySlugsByStore(storeId!),
    enabled: !!storeId && enabled,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
  })
}

