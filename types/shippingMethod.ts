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
  isActive: boolean;
  orders?: Order[];
  createdAt: Date;
  updatedAt: Date;
}

// Nueva interfaz para los precios en el formulario de creación/edición
export interface ShippingMethodPriceInput {
  currencyId: string;
  price: number;
}

export interface CreateShippingMethodDto {
  storeId: string;
  name: string;
  description?: string;
  estimatedDeliveryTime?: string;
  isActive?: boolean;
  prices: ShippingMethodPriceInput[]; // Usar la nueva interfaz
}

export interface UpdateShippingMethodDto {
  name?: string;
  description?: string;
  estimatedDeliveryTime?: string;
  isActive?: boolean;
  prices?: ShippingMethodPriceInput[]; // Usar la nueva interfaz
}

export interface ShippingMethodPrice {
  id: string;
  shippingMethodId: string;
  shippingMethod?: ShippingMethod;
  currencyId: string;
  currency?: Currency;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mantener esta interfaz para la API
export interface CreateShippingMethodPriceDto {
  shippingMethodId: string;
  currencyId: string;
  price: number;
}

export interface UpdateShippingMethodPriceDto {
  price: number;
}