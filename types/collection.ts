import { Timestamps } from './common';
import { Product } from './product';

export interface Collection extends Timestamps {
  id: string;
  title: string;
  description?: string;
  slug: string;
  products: Product[];
  imageUrl?: string;
}

export interface CreateCollectionDto {
  title: string;
  description?: string;
  slug: string;
  productIds: string[];
  imageUrl?: string;
}

export interface UpdateCollectionDto {
  title?: string;
  description?: string;
  productIds?: string[];
  slug?: string;
  imageUrl?: string;
}

