/**
 * Central place for React Query keys.
 *
 * Keep keys stable and structured so you can:
 * - invalidate exact slices of server-state
 * - avoid typos across the app
 * - migrate endpoint-by-endpoint safely
 */

function statsKey(
  domain: string,
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): readonly string[] {
  const parts: string[] = ["statistics", domain, storeId]
  parts.push(startDate ? startDate.toISOString().split("T")[0] : "_")
  parts.push(endDate ? endDate.toISOString().split("T")[0] : "_")
  parts.push(currencyId ?? "_")
  return parts
}

function trendsKey(
  storeId: string,
  startDate?: Date,
  endDate?: Date,
  groupBy?: string,
  currencyId?: string
): readonly string[] {
  const parts: string[] = ["statistics", "trends", storeId]
  parts.push(groupBy ?? "_")
  parts.push(startDate ? startDate.toISOString().split("T")[0] : "_")
  parts.push(endDate ? endDate.toISOString().split("T")[0] : "_")
  parts.push(currencyId ?? "_")
  return parts
}

function entityKey(
  domain: string,
  storeId: string,
  params?: Record<string, unknown>
): readonly (string | number)[] {
  const key: (string | number)[] = [domain, storeId]
  if (!params) return key
  const sorted = Object.entries(params)
    .filter(
      ([, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([k, v]) => [
      k,
      Array.isArray(v) ? [...v].sort().join(",") : String(v),
    ])
  return sorted.length > 0 ? [...key, ...sorted] : key
}

export const queryKeys = {
  auth: {
    session: () => ["auth", "session"] as const,
  },
  currencies: {
    all: () => ["currencies"] as const,
  },
  exchangeRates: {
    all: () => ["exchangeRates"] as const,
  },
  shopSettings: {
    byStore: (storeId: string) => ["shopSettings", storeId] as const,
  },
  vendors: {
    byStore: (storeId: string) => ["vendors", storeId] as const,
  },
  categorySlugs: {
    byStore: (storeId: string) => ["categorySlugs", storeId] as const,
  },
  collections: {
    byStore: (storeId: string) => ["collections", storeId] as const,
  },
  categories: {
    byStore: (
      storeId: string,
      params?: {
        page?: number
        limit?: number
        query?: string
        parentId?: string
        sortBy?: string
        sortOrder?: "asc" | "desc"
      }
    ) => entityKey("categories", storeId, params as Record<string, unknown>),
  },
  products: {
    byStore: (
      storeId: string,
      params?: {
        page?: number
        limit?: number
        query?: string
        vendor?: string[]
        categorySlugs?: string[]
        status?: string[]
        sortBy?: string
        sortOrder?: "asc" | "desc"
      }
    ) => entityKey("products", storeId, params as Record<string, unknown>),
  },
  product: {
    byId: (storeId: string, productId: string) => ["product", storeId, productId] as const,
  },
  statistics: {
    overview: (s: string, sd?: Date, ed?: Date, c?: string) =>
      statsKey("overview", s, sd, ed, c),
    sales: (s: string, sd?: Date, ed?: Date, c?: string) =>
      statsKey("sales", s, sd, ed, c),
    products: (s: string, sd?: Date, ed?: Date, c?: string) =>
      statsKey("products", s, sd, ed, c),
    customers: (s: string, sd?: Date, ed?: Date, c?: string) =>
      statsKey("customers", s, sd, ed, c),
    weeklyPerformance: (s: string, sd?: Date, ed?: Date, c?: string) =>
      statsKey("weeklyPerformance", s, sd, ed, c),
    inventory: (storeId: string, currencyId?: string) => {
      const key = ["statistics", "inventory", storeId] as const
      return currencyId ? ([...key, currencyId] as const) : key
    },
    trends: (s: string, sd?: Date, ed?: Date, groupBy?: string, c?: string) =>
      trendsKey(s, sd, ed, groupBy, c),
  },
} as const

