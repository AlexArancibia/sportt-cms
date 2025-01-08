import { ProductStatus, Timestamps } from './common';
import { Category } from './category';
import { Collection } from './collection';
import { CreateProductPriceDto, ProductPrice } from './productPrice';
import { CreateProductVariantDto, ProductVariant } from './productVariant';

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
  imageUrls: string[];
  collections: Collection[];
  sku?: string;
  inventoryQuantity: number;
  weightValue?: number;
  weightUnit?: string;
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
  weightUnit?: string;  
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
  weightUnit?: string;
  prices?: CreateProductPriceDto[];
  variants?: CreateProductVariantDto[];
}


export interface ProductOption {
  name: string;
  values: string[];
}