import { Product } from './product';
import { Store } from './store'; // Asumiendo que existe la interfaz Store
import { Coupon } from './coupon'; // Asumiendo que existe la interfaz Coupon

export interface Collection {
  id: string;
  storeId: string; // Relación con Store
  store?: Store; // Opcional
  title: string;
  description?: string | null;
  slug: string;
  products?: Product[]; // Opcional
  imageUrl?: string | null;
  isFeatured: boolean; // Añadido según schema
  metaTitle?: string | null; // Añadido según schema
  metaDescription?: string | null; // Añadido según schema
  coupons?: Coupon[]; // Relación con Coupon
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface CreateCollectionDto {
  storeId: string; // Requerido según schema
  title: string;
  description?: string;
  slug: string;
  productIds?: string[]; // IDs de productos en lugar de objetos completos
  imageUrl?: string;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateCollectionDto {
  title?: string;
  description?: string | null;
  slug?: string;
  productIds?: string[]; // IDs de productos en lugar de objetos completos
  imageUrl?: string | null;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}