import { Product } from './product';
import { VariantPrice, CreateVariantPriceDto } from './variantPrice';
import { Order } from './order'; // Asumiendo que existe la interfaz Order
import { FrequentlyBoughtTogether } from './fbt';

export interface ProductVariant {
  id: string;
  productId: string;
  product?: Product; // Relación opcional
  title: string;
  sku?: string | null; // Ajustado según schema (puede ser null)
  attributes: Record<string, any> | null; // Ajustado según schema (puede ser null)
  isActive: boolean; // No opcional según schema
  imageUrls?: string[]; // Ajustado según schema (puede ser null)
  prices: VariantPrice[];
  inventoryQuantity: number;
  weightValue?: number | null; // Ajustado según schema (puede ser null)
  position: number;
  orderItems?: Order[]; // Relación opcional añadida según schema
  frequentlyBoughtTogether?: FrequentlyBoughtTogether[]; // Relación opcional añadida según schema
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface CreateProductVariantDto {
  productId?: string; // Requerido según schema
  title: string;
  sku?: string;
  attributes?: Record<string, any>;
  isActive?: boolean;
  imageUrls?: string[];
  inventoryQuantity?: number;
  weightValue?: number;
  prices: CreateVariantPriceDto[];
  position?: number;
}

export interface UpdateProductVariantDto {
  id?:string;
  title?: string;
  sku?: string | null;
  attributes?: Record<string, any> | null;
  isActive?: boolean;
  imageUrls?: string[];
  inventoryQuantity?: number;
  weightValue?: number | null;
  prices?: CreateVariantPriceDto[];
  position?: number;
}