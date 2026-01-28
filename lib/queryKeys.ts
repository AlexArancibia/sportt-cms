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
  shopSettings: {
    byStore: (storeId: string) => ["shopSettings", storeId] as const,
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

