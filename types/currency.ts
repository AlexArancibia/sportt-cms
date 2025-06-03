import { CurrencyPosition } from './common';
import { ShopSettings, Store } from './store'; // Asumiendo que existe la interfaz Store
import { ExchangeRate } from './exchangeRate'; // Asumiendo que existe la interfaz ExchangeRate
import { Order } from './order'; // Asumiendo que existe la interfaz Order

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
  defaultForShop?: ShopSettings | null; // Relación opcional
  acceptedByShops?: ShopSettings[]; // Relación opcional
  baseForShops?: ShopSettings[]; // Relación opcional
  fromExchangeRates?: ExchangeRate[]; // Relación opcional (añadido según schema)
  toExchangeRates?: ExchangeRate[]; // Relación opcional (añadido según schema)
  orders?: Order[]; // Relación opcional (añadido según schema)
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