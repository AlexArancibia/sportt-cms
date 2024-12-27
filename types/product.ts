export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  quantity: number;
  isArchived: boolean;
  coverImage: string | null;
  galleryImages: string[];
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

export interface Variant {
  id: string;
  productId: string;
  price: string;
  quantity: number;
  attributes: Record<string, string>;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
  coverImage?: string | null;
  galleryImages: string[];
  variants?: Array<{
    price: number;
    quantity: number;
    attributes: Record<string, string>;
    imageUrl?: string | null;
  }>;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  categoryId?: string;
  isArchived?: boolean;
  coverImage?: string | null;
  galleryImages?: string[];
  variants?: Array<{
    id?: string;
    price?: number;
    quantity?: number;
    attributes?: Record<string, string>;
    imageUrl?: string | null;
  }>;
}
