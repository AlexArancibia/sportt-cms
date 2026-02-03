import { Currency } from "./currency";
import { Order } from "./order";
import { Store } from "./store";

export interface ShippingMethod {
  id: string;
  storeId: string;
  store?: Store;
  name: string;
  description?: string | null;
  prices: ShippingMethodPrice[];
  estimatedDeliveryTime?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
  isActive: boolean;
  availableDays: string[];
  cutOffTime?: string | null;
  orders?: Order[];
  minWeight?: number | null;
  maxWeight?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingMethodPriceInput {
  currencyId: string;
  price: number;
  zoneName?: string | null;  // Permitir null aquí
  zoneDescription?: string | null;  // Permitir null aquí
  countryCodes?: string[];
  stateCodes?: string[];
  cityNames?: string[];
  postalCodes?: string[];
  postalCodePatterns?: string[];
  pricePerKg?: number | null;
  freeWeightLimit?: number | null;
  zonePriority?: number | null ;
  isZoneActive?: boolean ;
  freeShippingThreshold?: number | null;
  freeShippingMessage?: string | null;
}

export interface CreateShippingMethodDto {
  name: string;
  description?: string;
  estimatedDeliveryTime?: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  isActive?: boolean;
  availableDays?: string[];
  cutOffTime?: string;
  maxWeight?: number;
  prices: ShippingMethodPriceInput[];
}

export interface UpdateShippingMethodDto {
  name?: string;
  description?: string;
  estimatedDeliveryTime?: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  isActive?: boolean;
  availableDays?: string[];
  cutOffTime?: string;
  maxWeight?: number;
  prices?: ShippingMethodPriceInput[];
}

export interface ShippingMethodPrice {
  id: string;
  shippingMethodId: string;
  shippingMethod?: ShippingMethod;
  currencyId: string;
  currency?: Currency;
  price: number;
  zoneName?: string | null;
  zoneDescription?: string | null;
  countryCodes: string[];
  stateCodes: string[];
  cityNames: string[];
  postalCodes: string[];
  postalCodePatterns: string[];
  pricePerKg?: number | null;
  freeWeightLimit?: number | null;
  zonePriority: number | null;
  isZoneActive: boolean;
  freeShippingThreshold?: number | null;
  freeShippingMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingMethodPriceDto {
  shippingMethodId: string;
  currencyId: string;
  price: number;
  zoneName?: string;
  zoneDescription?: string;
  countryCodes?: string[];
  stateCodes?: string[];
  cityNames?: string[];
  postalCodes?: string[];
  postalCodePatterns?: string[];
  pricePerKg?: number;
  freeWeightLimit?: number;
  zonePriority?: number;
  isZoneActive?: boolean;
  freeShippingThreshold?: number;
  freeShippingMessage?: string;
}

export interface UpdateShippingMethodPriceDto {
  price?: number;
  zoneName?: string;
  zoneDescription?: string;
  countryCodes?: string[];
  stateCodes?: string[];
  cityNames?: string[];
  postalCodes?: string[];
  postalCodePatterns?: string[];
  pricePerKg?: number;
  freeWeightLimit?: number;
  zonePriority?: number;
  isZoneActive?: boolean;
  freeShippingThreshold?: number;
  freeShippingMessage?: string;
}

// Geographic Data Interfaces
export interface Country {
  id: string;
  code: string;
  code3: string;
  name: string;
  nameLocal?: string | null;
  phoneCode?: string | null;
  currency?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface State {
  id: string;
  countryCode: string;
  country?: Country;
  code: string;
  name: string;
  nameLocal?: string | null;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface City {
  id: string;
  stateId: string;
  state?: State;
  name: string;
  nameLocal?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeographicDataResponse {
  type: 'countries' | 'states' | 'cities';
  countryCode?: string;
  stateId?: string;
  data: Country[] | State[] | City[];
}

export interface GeographicSearchResponse {
  searchTerm: string;
  type: 'country' | 'state' | 'city' | 'all';
  results: {
    countries: Country[];
    states: State[];
    cities: City[];
  };
  totalResults: number;
}