import { ProductVariant } from './productVariant'; // Asumiendo que existe la interfaz ProductVariant
import { Store } from './store'; // Asumiendo que existe la interfaz Store

export interface FrequentlyBoughtTogether {
  id: string;
  storeId: string; // Relación con Store según schema
  store?: Store; // Relación opcional
  name: string;
  variantIds: string[]; // IDs de variantes según backend
  variants?: ProductVariant[]; // Relación opcional
  discountName?: string | null; // Hacer explícito que puede ser null
  discount?: number | null; // Hacer explícito que puede ser null
  isActive?: boolean; // Nuevo campo según backend
  createdAt: Date; // Cambiado a Date según Prisma
  updatedAt: Date; // Cambiado a Date según Prisma
}

export interface CreateFrequentlyBoughtTogetherDto {
  storeId: string; // Requerido según schema
  name: string;
  variantIds: string[]; // IDs de variantes en lugar de objetos completos
  discountName?: string;
  discount?: number;
  isActive?: boolean; // Nuevo campo según backend
}

export interface UpdateFrequentlyBoughtTogetherDto {
  name?: string;
  variantIds?: string[]; // IDs de variantes en lugar de objetos completos
  discountName?: string | null;
  discount?: number | null;
  isActive?: boolean; // Nuevo campo según backend
}