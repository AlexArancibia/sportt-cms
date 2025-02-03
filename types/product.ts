import { ProductStatus, Timestamps } from './common';
import { Category } from './category';
import { Collection } from './collection';
import { CreateProductPriceDto, ProductPrice } from './productPrice';
import { CreateProductVariantDto, ProductVariant, UpdateProductVariantDto } from './productVariant';

export interface Product extends Timestamps {
  id: string;
  title: string;
  description?: string;
  slug: string;
  vendor?: string;
  prices: ProductPrice[];
  status: ProductStatus;
  categories: Category[];
  variants: ProductVariant[];
  allowBackorder: boolean
  imageUrls: string[];
  collections: Collection[];
  sku?: string;
  inventoryQuantity: number;
  weightValue?: number;
  isArchived: boolean;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  slug: string;
  vendor?: string;
  status: ProductStatus;
  categoryIds: string[];
  collectionIds: string[];
  imageUrls: string[];
  sku?: string;
  inventoryQuantity: number;
  weightValue?: number;
  prices: CreateProductPriceDto[];
  variants: CreateProductVariantDto[];
}

export interface UpdateProductDto {
  title?: string;
  description?: string;
  slug?: string;
  vendor?: string;
  status?: ProductStatus;
  categoryIds?: string[];
  collectionIds?: string[];
  imageUrls?: string[];
  sku?: string;
  inventoryQuantity?: number;
  weightValue?: number;
  prices?: CreateProductPriceDto[];
  variants?: UpdateProductVariantDto[];
}


export interface ProductOption {
  name: string;
  values: string[];
}