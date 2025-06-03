import { Product } from './product';
import { Store } from './store'; // Asumiendo que existe una interfaz Store

export interface Category {
  id: string;
  storeId: string; // Añadido según schema (relación con Store)
  store?: Store; // Relación opcional
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null; // Añadido según schema
  parentId?: string | null;
  parent?: Category | null; // Hacer explícito que puede ser null
  children?: Category[]; // Hacer opcional según uso
  products?: Product[]; // Hacer opcional según uso
  metaTitle?: string | null; // Añadido según schema
  metaDescription?: string | null; // Añadido según schema
  createdAt: Date; // Cambiado a Date según Prisma
  updatedAt: Date; // Cambiado a Date según Prisma
}

export interface CreateCategoryDto {
  storeId: string; // Requerido según schema
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}