export type MovementType = 'COMPRA' | 'VENTA' | 'DEVOLUCION' | 'AJUSTE'

export type ValuationMethod = 'WEIGHTED_AVERAGE' | 'FIFO'

export interface KardexFilters {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  valuationMethod?: ValuationMethod
  category?: string[]
  movementType?: MovementType[]
}

export interface MovementValue {
  currency: {
    id: string
    code: string
    symbol: string
  }
  unitCost: number
  totalCost: number
  exchangeRate: number
  exchangeRateDate: string | Date
}

export interface KardexMovement {
  date: string | Date
  type: MovementType
  reference?: string
  in: number
  out: number
  finalStock: number
  unitCost: number
  totalCost: number
  values?: MovementValue[]  // Valores en múltiples monedas (vacío para AJUSTE)
}

export interface CurrencyValue {
  currency: {
    id: string
    code: string
    symbol: string
  }
  totalValue: number
}

export interface KardexVariantSummary {
  initialStock: number
  totalIn: number
  totalOut: number
  finalStock: number
  avgUnitCost: number
  totalValuesByCurrency: CurrencyValue[]
}

export interface KardexVariant {
  id: string
  sku?: string
  name: string
  movements: KardexMovement[]
  summary: KardexVariantSummary
}

export interface KardexProduct {
  product: {
    id: string
    name: string
    categories: string[]
  }
  variants: KardexVariant[]
}

export interface KardexResponse {
  data: KardexProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

