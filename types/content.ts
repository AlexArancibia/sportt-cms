import type { ContentType } from "./common";
import type { User } from "./user";
import type { Store } from "./store"; // Asumiendo que existe la interfaz Store

export interface Content {
  id: string;
  storeId: string; // Añadido según schema (relación con Store)
  store?: Store; // Relación opcional
  title: string;
  slug: string;
  body?: string | null;
  type: ContentType;
  category?: string | null; // Añadido según schema
  authorId?: string | null; // Hacer explícito que puede ser null
  author?: User | null; // Hacer explícito que puede ser null
  published: boolean;
  publishedAt?: Date | null; // Hacer explícito que puede ser null
  featuredImage?: string | null; // Hacer explícito que puede ser null
  metadata?: Record<string, any> | null; // Hacer explícito que puede ser null
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentDto {
  storeId: string; // Requerido según schema
  title: string;
  slug: string;
  body?: string;
  type: ContentType;
  category?: string;
  authorId?: string;
  published?: boolean;
  publishedAt?: Date;
  featuredImage?: string;
  metadata?: Record<string, any>;
}

export interface UpdateContentDto {
  title?: string;
  slug?: string;
  body?: string | null;
  type?: ContentType;
  category?: string | null;
  authorId?: string | null;
  published?: boolean;
  publishedAt?: Date | null;
  featuredImage?: string | null;
  metadata?: Record<string, any> | null;
}