import { Product } from './product';

export interface Collection {
  id: string;
  name: string;
  description: string;
  products: Product[];
  isFeatured: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionDto {
  name: string;
  description: string;
  productIds: string[];
  isFeatured: boolean;
  imageUrl?: string;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  productIds?: string[];
  isFeatured?: boolean;
  imageUrl?: string | null;
}

