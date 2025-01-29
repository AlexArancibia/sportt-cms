import type { Product } from "./product"
import type { Category } from "./category"
import type { Collection } from "./collection"
import type { Order } from "./order"

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
  BUY_X_GET_Y = "BUY_X_GET_Y",
  FREE_SHIPPING = "FREE_SHIPPING",
}

export interface Coupon {
  id: string
  code: string
  description?: string
  type: DiscountType
  value: number
  minPurchase?: number
  maxUses?: number
  usedCount: number
  startDate: string
  endDate: string
  isActive: boolean
  applicableProducts?: Product[]
  applicableCategories?: Category[]
  applicableCollections?: Collection[]
  orders?: Order[]
  createdAt: string
  updatedAt: string
}

export interface CreateCouponDto {
  code: string
  description?: string
  type: DiscountType
  value: number
  minPurchase?: number
  usedCount: number
  maxUses?: number
  startDate: string
  endDate: string
  isActive: boolean
  applicableProductIds?: string[]
  applicableCategoryIds?: string[]
  applicableCollectionIds?: string[]
}

export interface UpdateCouponDto {
  code?: string
  description?: string
  type?: DiscountType
  value?: number
  usedCount?: number
  minPurchase?: number
  maxUses?: number
  startDate?: string
  endDate?: string
  isActive?: boolean
  applicableProductIds?: string[]
  applicableCategoryIds?: string[]
  applicableCollectionIds?: string[]
}

