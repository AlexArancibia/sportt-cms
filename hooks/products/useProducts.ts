import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import type {
  PaginatedProductsResponse,
  Product,
  ProductSearchParams,
} from "@/types/product"

const PRODUCTS_PAGE_LIMIT = 100
const MAX_PRODUCT_PAGES = 500

/** Una página de productos desde el backend. Usado por useProducts y por export CSV/PDF. */
export async function fetchProductsByStore(
  storeId: string,
  params?: ProductSearchParams
): Promise<PaginatedProductsResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append("page", String(params?.page ?? 1))
  queryParams.append("limit", String(params?.limit ?? 20))
  queryParams.append("sortBy", params?.sortBy ?? "createdAt")
  queryParams.append("sortOrder", params?.sortOrder ?? "desc")
  if (params?.query) queryParams.append("query", params.query)
  if (params?.vendor?.length) params.vendor.forEach((v) => queryParams.append("vendor", v))
  if (params?.minPrice !== undefined) queryParams.append("minPrice", String(params.minPrice))
  if (params?.maxPrice !== undefined) queryParams.append("maxPrice", String(params.maxPrice))
  if (params?.currencyId) queryParams.append("currencyId", params.currencyId)
  params?.status?.forEach((s) => queryParams.append("status", s))
  params?.categorySlugs?.forEach((slug) => queryParams.append("categorySlugs", slug))
  params?.collectionIds?.forEach((id) => queryParams.append("collectionIds", id))

  const { data } = await apiClient.get<PaginatedProductsResponse>(
    `/products/${storeId}?${queryParams.toString()}`
  )
  if (!data?.data || !data?.pagination) throw new Error("Invalid API response structure")
  return data
}

/** Recorre todas las páginas y devuelve el array completo. Para export CSV/PDF. */
export async function fetchAllProductsByStore(
  storeId: string,
  filters: {
    query?: string
    vendor?: string[]
    categorySlugs?: string[]
  } = {}
): Promise<Product[]> {
  const out: Product[] = []
  let page = 1
  let hasMore = true
  while (hasMore && page <= MAX_PRODUCT_PAGES) {
    const res = await fetchProductsByStore(storeId, {
      page,
      limit: PRODUCTS_PAGE_LIMIT,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(filters.query && { query: filters.query }),
      ...(filters.vendor?.length && { vendor: filters.vendor }),
      ...(filters.categorySlugs?.length && { categorySlugs: filters.categorySlugs }),
    })
    const chunk = res.data ?? []
    out.push(...chunk)
    hasMore = Boolean(res.pagination?.hasNext) && chunk.length === PRODUCTS_PAGE_LIMIT
    page++
  }
  return out
}

export function useProducts(
  storeId: string | null,
  params?: ProductSearchParams,
  enabled: boolean = true
) {
  const safeStoreId = storeId ?? "__none__"
  return useQuery({
    queryKey: queryKeys.products.byStore(safeStoreId, {
      page: params?.page,
      limit: params?.limit,
      query: params?.query,
      vendor: params?.vendor,
      categorySlugs: params?.categorySlugs,
      status: params?.status,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    }),
    queryFn: () => fetchProductsByStore(storeId!, params),
    enabled: !!storeId && enabled,
  })
}
