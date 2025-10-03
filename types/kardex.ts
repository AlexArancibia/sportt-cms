import { Product } from './product'
import { Timestamps, MovementType } from './common'

export interface Kardex extends Timestamps {
  id: string
  productId: string
  product?: Product
  sku: string
  productName: string
  category: string
  unit: string
  movements?: KardexMovement[]
  initialStock: number
  finalStock: number
  totalEntries: number
  totalExits: number
  totalValue: number
  minStock?: number | null
}

export interface KardexMovement {
  id: string
  kardexId: string
  kardex?: Kardex
  date: Date
  type: MovementType
  reference?: string | null
  entryQty: number
  exitQty: number
  finalStock: number
  unitCost: number
  totalCost: number
  createdAt: Date
}



