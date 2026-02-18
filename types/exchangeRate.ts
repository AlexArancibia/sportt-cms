import { Timestamps } from './common';
import { Currency } from './currency';

export interface ExchangeRate extends Timestamps {
  id: string;
  storeId: string;
  fromCurrency: Currency;
  fromCurrencyId: string;
  toCurrency: Currency;
  toCurrencyId: string;
  rate: number;
  effectiveDate: string;
}

export interface CreateExchangeRateDto {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: string;
}

export interface UpdateExchangeRateDto {
  rate?: number;
  effectiveDate?: string;
}

