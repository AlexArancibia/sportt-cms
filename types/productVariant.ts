import { Timestamps } from './common';
import { Product } from './product';
import { VariantPrice, CreateVariantPriceDto } from './variantPrice';

// Define the structure of a product variant
export interface ProductVariant extends Timestamps {
  id: string;
  product: Product;
  productId: string;
  title: string;
  sku: string;
  attributes: Record<string, string>;
  imageUrl: string;
  prices: VariantPrice[];
  compareAtPrice?: number;
  inventoryQuantity: number;
  weightValue: number;
  weightUnit: string;
  position: number;
}

// Define the structure for creating a new product variant
export interface CreateProductVariantDto {
  title: string;
  sku: string;
  attributes: Record<string, string>;
  imageUrl: string;
  inventoryQuantity: number;
  weightValue: number;
  weightUnit: string;
  prices: CreateVariantPriceDto[];
}

// Define the structure for updating an existing product variant
export interface UpdateProductVariantDto {
  title?: string;
  sku?: string;
  attributes?: Record<string, string>;
  imageUrl?: string;
  inventoryQuantity?: number;
  weightValue?: number;
  weightUnit?: string;
  prices?: CreateVariantPriceDto[];
}

