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
  stores: {
    byOwner: (ownerId: string) => ["stores", "owner", ownerId] as const,
  },
  currencies: {
    all: () => ["currencies"] as const,
  },
  exchangeRates: {
    all: (storeId: string | null) => ["exchangeRates", storeId] as const,
    latestPerPair: (storeId: string | null) =>
      ["exchangeRates", "latestPerPair", storeId] as const,
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
    byId: (storeId: string, collectionId: string) =>
      ["collections", storeId, collectionId] as const,
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
        mode?: "flat" | "tree"
      }
    ) => entityKey("categories", storeId, params as Record<string, unknown>),
  },
  variantsMismatchedPrices: {
    all: () => ["variantsMismatchedPrices"] as const,
    byStore: (storeId: string, page?: number, limit?: number) =>
      ["variantsMismatchedPrices", storeId, page ?? 1, limit ?? 20] as const,
    allForStore: (storeId: string) =>
      ["variantsMismatchedPrices", storeId] as const,
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
  variant: {
    bySku: (storeId: string, sku: string) => ["product", "variant", storeId, sku] as const,
  },
  orders: {
    byStore: (
      storeId: string,
      params?: {
        page?: number
        limit?: number
        query?: string
        financialStatus?: string
        fulfillmentStatus?: string
        paymentStatus?: string
        shippingStatus?: string
        startDate?: string
        endDate?: string
        sortBy?: string
        sortOrder?: string
      }
    ) => entityKey("orders", storeId, params as Record<string, unknown>),
    nextOrderNumber: (storeId: string) => ["orders", storeId, "next-order-number"] as const,
  },
  order: {
    byId: (storeId: string, orderId: string) => ["order", storeId, orderId] as const,
  },
  customers: {
    all: () => ["customers"] as const,
    byStore: (storeId: string) => ["customers", storeId] as const,
  },
  fbt: {
    byStore: (storeId: string) => ["fbt", storeId] as const,
    byId: (storeId: string, fbtId: string) => ["fbt", storeId, fbtId] as const,
  },
  cardSections: {
    byStore: (storeId: string) => ["cardSections", storeId] as const,
    byId: (storeId: string, sectionId: string) => ["cardSections", storeId, sectionId] as const,
  },
  contents: {
    byStore: (storeId: string) => ["contents", storeId] as const,
    byId: (storeId: string, contentId: string) => ["contents", storeId, contentId] as const,
  },
  coupons: {
    byStore: (storeId: string) => ["coupons", storeId] as const,
    byId: (storeId: string, couponId: string) => ["coupons", storeId, couponId] as const,
  },
  heroSections: {
    byStore: (storeId: string) => ["heroSections", storeId] as const,
    byId: (storeId: string, heroSectionId: string) =>
      ["heroSections", storeId, heroSectionId] as const,
  },
  teamSections: {
    byStore: (storeId: string) => ["teamSections", storeId] as const,
    byId: (sectionId: string) => ["teamSections", sectionId] as const,
  },
  users: {
    byStore: (storeId: string) => ["users", storeId] as const,
    all: () => ["users"] as const,
  },
  shippingMethods: {
    byStore: (storeId: string) => ["shippingMethods", storeId] as const,
  },
  geographic: {
    countries: () => ["geographic", "countries"] as const,
    states: (countryId: string) => ["geographic", "states", countryId] as const,
    cities: (countryId: string, stateId: string) =>
      ["geographic", "cities", countryId, stateId] as const,
  },
  paymentProviders: {
    byStore: (storeId: string) => ["paymentProviders", storeId] as const,
  },
  kardex: {
    general: (
      storeId: string,
      params?: {
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
        query?: string
        sortBy?: string
        sortOrder?: string
        category?: string[]
        movementType?: string[]
        currency?: string[]
      }
    ) => entityKey("kardex", storeId, params as Record<string, unknown>),
    stats: (
      storeId: string,
      params?: {
        startDate?: string
        endDate?: string
        query?: string
        category?: string[]
        movementType?: string[]
        currency?: string[]
      }
    ) => entityKey("kardexStats", storeId, params as Record<string, unknown>),
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

