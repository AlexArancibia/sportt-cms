import { CurrencyPosition, Timestamps } from './common';
import { ShopSettings } from './shopSettings';

export interface Currency extends Timestamps {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: CurrencyPosition;
  isActive: boolean;
  defaultForShop?: ShopSettings;
  acceptedByShops: ShopSettings[];
  baseForShops: ShopSettings[];
}

export interface CreateCurrencyDto {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: CurrencyPosition;
  isActive: boolean;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  symbolPosition?: CurrencyPosition;
  isActive?: boolean;
}

