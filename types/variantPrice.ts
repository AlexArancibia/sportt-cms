import { Timestamps } from './common';
import { ProductVariant } from './productVariant';
import { Currency } from './currency';

export interface VariantPrice extends Timestamps {
  id: string;
  variant?: ProductVariant;
  variantId: string;
  currency: Currency;
  currencyId: string;
  price: number;
  originalPrice?: number | null;
}

export interface CreateVariantPriceDto {
  currencyId: string;
  price: number;
  originalPrice?: number | null;
}

export interface UpdateVariantPriceDto {
  currencyId?: string
  price?: number;
  originalPrice?: number | null;
}

