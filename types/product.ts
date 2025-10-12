import { ProductStatus } from './common';
import { Category } from './category';
import { Collection } from './collection';
import { Store } from './store'; // Asumiendo que existe la interfaz Store
import { CreateProductVariantDto, ProductVariant, UpdateProductVariantDto } from './productVariant';
import { Coupon } from './coupon';

export interface Product {
  id: string;
  storeId: string; // Añadido según schema
  store?: Store; // Relación opcional
  title: string;
  description?: string | null;
  slug: string;
  vendor?: string | null;
  allowBackorder: boolean;
  releaseDate?: Date | null; // Añadido según schema
  status: ProductStatus;
  viewCount?: number | null; // Añadido según schema
  restockThreshold?: number | null; // Añadido según schema
  restockNotify?: boolean | null; // Añadido según schema
  categories?: Category[]; // Relación opcional
  variants: ProductVariant[]; // Relación opcional
  imageUrls: string[];
  collections?: Collection[]; // Relación opcional
  metaTitle?: string | null;
  metaDescription?: string | null;
  coupons?: Coupon[]; // Relación opcional
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface CreateProductDto {
  storeId: string; // Requerido según schema
  title: string;
  description?: string;
  slug: string;
  vendor?: string;
  allowBackorder?: boolean;
  releaseDate?: Date;
  status?: ProductStatus;
  categoryIds: string[]; // IDs en lugar de objetos completos
  collectionIds: string[]; // IDs en lugar de objetos completos
  imageUrls: string[];
  variants: CreateProductVariantDto[];
  metaTitle?: string;
  metaDescription?: string;
  restockThreshold?: number;
  restockNotify?: boolean;
}

export interface UpdateProductDto {
  title?: string;
  description?: string | null;
  slug?: string;
  vendor?: string | null;
  allowBackorder?: boolean;
  releaseDate?: Date | null;
  status?: ProductStatus;
  categoryIds?: string[];
  collectionIds?: string[];
  imageUrls?: string[];
  variants?: UpdateProductVariantDto[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  viewCount?: number | null;
  restockThreshold?: number | null;
  restockNotify?: boolean | null;
}

export interface ProductOption {
  title: string;
  values: string[];
}

// Interfaz de paginación según el backend
export interface ProductPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// Respuesta paginada del backend
export interface PaginatedProductsResponse {
  data: Product[];
  pagination: ProductPaginationMeta;
}

// Parámetros para búsqueda de productos
export interface ProductSearchParams {
  page?: number;
  limit?: number;
  query?: string;
  status?: string[];
  categorySlugs?: string[];
  collectionIds?: string[];
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
  currencyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}