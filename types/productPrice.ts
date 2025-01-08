import { Timestamps } from './common';
import { Product } from './product';
import { Currency } from './currency';

export interface ProductPrice extends Timestamps {
  id: string;
  product: Product;
  productId: string;
  currency: Currency;
  currencyId: string;
  price: number;
}

export interface CreateProductPriceDto {
  currencyId: string;
  price: number;
}

export interface UpdateProductPriceDto {
  price?: number;
}

