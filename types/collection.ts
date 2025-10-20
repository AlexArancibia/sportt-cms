import type { Product } from "./product"
import type { Store } from "./store"
import type { Coupon } from "./coupon"

export interface Collection {
  id: string
  storeId: string
  store?: Store
  title: string
  description?: string | null
  slug: string
  products?: Product[]
  imageUrl?: string | null
  isFeatured: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  coupons?: Coupon[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateCollectionDto {
  storeId?: string // Optional - handled by store, not sent in body
  title: string
  description?: string
  slug: string
  products?: { productId: string }[]
  imageUrl?: string
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateCollectionDto {
  title?: string
  description?: string | null
  slug?: string
  products?: { productId: string }[]
  imageUrl?: string | null
  isFeatured?: boolean
  metaTitle?: string | null
  metaDescription?: string | null
}
