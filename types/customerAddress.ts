import { Timestamps } from './common';
import { Customer } from './customer';

export interface CustomerAddress extends Timestamps {
  id: string;
  customer: Customer;
  customerId: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface CreateCustomerAddressDto {
  customerId: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateCustomerAddressDto {
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}
