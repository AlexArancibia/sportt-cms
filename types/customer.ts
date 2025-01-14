import { Timestamps } from './common';
import { Order } from './order';
import { CustomerAddress } from './customerAddress';

export interface Customer extends Timestamps {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  orders: Order[];
  addresses: CustomerAddress[];
}

export interface CreateCustomerDto {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password: string;
  acceptsMarketing?: boolean;
}

export interface UpdateCustomerDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  acceptsMarketing?: boolean;
}
