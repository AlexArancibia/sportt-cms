import { Timestamps } from './common';
import { Order } from './order';
import { Address, CreateAddressDto } from './address';

export interface Customer extends Timestamps {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  orders: Order[];
  addresses?: Address[];
}

export interface CreateCustomerDto {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password: string;
  acceptsMarketing?: boolean;
  addresses?: CreateAddressDto[];
}

export interface UpdateCustomerDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  acceptsMarketing?: boolean;
  addresses?: CreateAddressDto[];
}