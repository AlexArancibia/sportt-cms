/**
 * Central place for React Query keys.
 *
 * Keep keys stable and structured so you can:
 * - invalidate exact slices of server-state
 * - avoid typos across the app
 * - migrate endpoint-by-endpoint safely
 */
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
    ) => {
      const key = ["categories", storeId] as const
      if (!params) return key

      const paramsKey: any[] = []
      if (params.page) paramsKey.push("page", params.page)
      if (params.limit) paramsKey.push("limit", params.limit)
      if (params.query) paramsKey.push("query", params.query)
      if (params.parentId) paramsKey.push("parentId", params.parentId)
      if (params.sortBy) paramsKey.push("sortBy", params.sortBy)
      if (params.sortOrder) paramsKey.push("sortOrder", params.sortOrder)

      return paramsKey.length > 0 ? ([...key, ...paramsKey] as const) : key
    },
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
    ) => {
      const key = ["products", storeId] as const
      if (!params) return key
      
      const paramsKey: any[] = []
      if (params.page) paramsKey.push("page", params.page)
      if (params.limit) paramsKey.push("limit", params.limit)
      if (params.query) paramsKey.push("query", params.query)
      if (params.vendor && params.vendor.length > 0) paramsKey.push("vendor", params.vendor.sort().join(","))
      if (params.categorySlugs && params.categorySlugs.length > 0) paramsKey.push("categorySlugs", params.categorySlugs.sort().join(","))
      if (params.status && params.status.length > 0) paramsKey.push("status", params.status.sort().join(","))
      if (params.sortBy) paramsKey.push("sortBy", params.sortBy)
      if (params.sortOrder) paramsKey.push("sortOrder", params.sortOrder)
      
      return paramsKey.length > 0 ? ([...key, ...paramsKey] as const) : key
    },
  },
  product: {
    byId: (storeId: string, productId: string) => ["product", storeId, productId] as const,
  },
  statistics: {
    overview: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      currencyId?: string
    ) => {
      const key = ["statistics", "overview", storeId] as const
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...key, dateKey, endDateKey, currencyId] as const)
            : ([...key, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...key, dateKey, currencyId] as const) : ([...key, dateKey] as const)
      }
      return currencyId ? ([...key, currencyId] as const) : key
    },
    sales: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      currencyId?: string
    ) => {
      const key = ["statistics", "sales", storeId] as const
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...key, dateKey, endDateKey, currencyId] as const)
            : ([...key, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...key, dateKey, currencyId] as const) : ([...key, dateKey] as const)
      }
      return currencyId ? ([...key, currencyId] as const) : key
    },
    products: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      currencyId?: string
    ) => {
      const key = ["statistics", "products", storeId] as const
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...key, dateKey, endDateKey, currencyId] as const)
            : ([...key, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...key, dateKey, currencyId] as const) : ([...key, dateKey] as const)
      }
      return currencyId ? ([...key, currencyId] as const) : key
    },
    customers: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      currencyId?: string
    ) => {
      const key = ["statistics", "customers", storeId] as const
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...key, dateKey, endDateKey, currencyId] as const)
            : ([...key, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...key, dateKey, currencyId] as const) : ([...key, dateKey] as const)
      }
      return currencyId ? ([...key, currencyId] as const) : key
    },
    inventory: (storeId: string, currencyId?: string) => {
      const key = ["statistics", "inventory", storeId] as const
      return currencyId ? ([...key, currencyId] as const) : key
    },
    trends: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      groupBy?: string,
      currencyId?: string
    ) => {
      const key = ["statistics", "trends", storeId] as const
      const withGroupBy = groupBy ? ([...key, groupBy] as const) : key
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...withGroupBy, dateKey, endDateKey, currencyId] as const)
            : ([...withGroupBy, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...withGroupBy, dateKey, currencyId] as const) : ([...withGroupBy, dateKey] as const)
      }
      return currencyId ? ([...withGroupBy, currencyId] as const) : withGroupBy
    },
    weeklyPerformance: (
      storeId: string,
      startDate?: Date,
      endDate?: Date,
      currencyId?: string
    ) => {
      const key = ["statistics", "weeklyPerformance", storeId] as const
      if (startDate) {
        const dateKey = startDate.toISOString().split("T")[0]
        if (endDate) {
          const endDateKey = endDate.toISOString().split("T")[0]
          return currencyId
            ? ([...key, dateKey, endDateKey, currencyId] as const)
            : ([...key, dateKey, endDateKey] as const)
        }
        return currencyId ? ([...key, dateKey, currencyId] as const) : ([...key, dateKey] as const)
      }
      return currencyId ? ([...key, currencyId] as const) : key
    },
  },
} as const

