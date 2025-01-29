import { Timestamps } from "./common"
import type { Order } from "./order"

export interface ShippingMethod  extends Timestamps {
  id: string
  name: string
  description?: string
  price: number
  estimatedDeliveryTime?: string
  isActive: boolean
  orders?: Order[]
}

export interface CreateShippingMethodDto {
  name: string
  description?: string
  price: number
  estimatedDeliveryTime?: string
  isActive: boolean
}

export interface UpdateShippingMethodDto {
  name?: string
  description?: string
  price?: number
  estimatedDeliveryTime?: string
  isActive?: boolean
}

