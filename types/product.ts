import { ProductStatus, Timestamps } from './common';
import { Category } from './category';
import { Collection } from './collection';

import { CreateProductVariantDto, ProductVariant, UpdateProductVariantDto } from './productVariant';
import { Coupon } from './coupon';

export interface Product extends Timestamps {
  id: string
  title: string
  description?: string
  slug: string
  vendor?: string
  fbt: Record<string, any>
  allowBackorder: boolean
  status: ProductStatus
  categories: Category[]
  variants: ProductVariant[]
  imageUrls: string[]
  collections: Collection[]
  metaTitle?: string
  metaDescription?: string
  coupons: Coupon[]
}

export interface CreateProductDto {
  title: string
  description?: string
  slug: string
  vendor?: string
  fbt: Record<string, any>
  allowBackorder?: boolean
  status: ProductStatus
  categoryIds: string[]
  collectionIds: string[]
  imageUrls: string[]
  variants: CreateProductVariantDto[]
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateProductDto {
  title?: string
  description?: string
  slug?: string
  vendor?: string
  fbt?: Record<string, any>
  allowBackorder?: boolean
  status?: ProductStatus
  categoryIds?: string[]
  collectionIds?: string[]
  imageUrls?: string[]
  variants?: UpdateProductVariantDto[]
  metaTitle?: string
  metaDescription?: string
}


export interface ProductOption {
  title: string;
  values: string[];
}