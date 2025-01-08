import { ShippingMethodType } from './common';

export interface ShippingMethod {
  id: string;
  name: string;
  type: ShippingMethodType;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingMethodDto {
  name: string;
  type: ShippingMethodType;
  description?: string;
  price: number;
  isActive?: boolean;
}

export interface UpdateShippingMethodDto {
  name?: string;
  type?: ShippingMethodType;
  description?: string | null;
  price?: number;
  isActive?: boolean;
}

