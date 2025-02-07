import { CurrencyPosition, Timestamps } from './common';
import { Currency } from './currency';

export interface ShopSettings extends Timestamps {
  id: string;
  name: string;
  domain: string;
  email?: string;
  shopOwner?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  defaultCurrency: Currency;
  defaultCurrencyId: string | null;
  acceptedCurrencies: Currency[];
  timezone?: string;
  weightUnit?: string;
  taxesIncluded: boolean;
  taxValue? : number;  
  taxShipping: boolean;
}

export interface CreateShopSettingsDto {
  name: string;
  domain: string;
  email?: string;
  shopOwner?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  defaultCurrencyId: string;
  timezone?: string;
  weightUnit?: string;
  taxesIncluded?: boolean;
  taxShipping?: boolean;
  acceptedCurrencies?: Currency[];
}

export interface UpdateShopSettingsDto {
  name?: string;
  domain?: string;
  email?: string;
  shopOwner?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  defaultCurrencyId?: string;
  timezone?: string;
  weightUnit?: string;
  taxesIncluded?: boolean;
  taxShipping?: boolean;
  acceptedCurrencies?: Currency[];
}

