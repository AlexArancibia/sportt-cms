import { CurrencyPosition } from './common';
import { ShopSettings } from './store';
import { ExchangeRate } from './exchangeRate';
import { Order } from './order';
import { PaymentProvider, PaymentTransaction } from './payments';
import { VariantPrice } from './variantPrice';
import { ShippingMethodPrice } from './shippingMethod';

export interface Currency {
  id: string;

  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: CurrencyPosition;
  isActive: boolean;
  autoUpdateRates?: boolean | null; // Añadido según schema
  updateFrequency?: string | null; // Añadido según schema
  roundingPrecision?: number | null; // Añadido según schema
  defaultForShops?: ShopSettings[]; // Relación con tiendas como moneda por defecto
  acceptedByShops?: ShopSettings[]; // Monedas aceptadas por tiendas
  fromExchangeRates?: ExchangeRate[]; // Relación opcional (añadido según schema)
  toExchangeRates?: ExchangeRate[]; // Relación opcional (añadido según schema)
  orders?: Order[];
  paymentProviders?: PaymentProvider[];
  paymentTransactions?: PaymentTransaction[];
  VariantPrice?: VariantPrice[];
  ShippingMethodPrice?: ShippingMethodPrice[];
  createdAt: Date; // Cambiado a Date según Prisma
  updatedAt: Date; // Cambiado a Date según Prisma
}

export interface CreateCurrencyDto {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition?: CurrencyPosition;
  isActive?: boolean;
  autoUpdateRates?: boolean;
  updateFrequency?: string;
  roundingPrecision?: number;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  symbolPosition?: CurrencyPosition;
  isActive?: boolean;
  autoUpdateRates?: boolean | null;
  updateFrequency?: string | null;
  roundingPrecision?: number | null;
}