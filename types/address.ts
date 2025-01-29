import { Timestamps } from './common';
import { Customer } from './customer';
import { Order } from './order';

export interface Address extends Timestamps {
  id: string

  isDefault: boolean | null
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string | null
  zip: string
  country: string
  phone: string | null
  ordersAsShipping: Order[]
  ordersAsBilling: Order[]
  customer: Customer
  customerId: string

}

export interface CreateAddressDto {

  isDefault?: boolean
  company?: string
  address1: string
  address2?: string
  city: string
  province?: string
  zip: string
  country: string
  phone?: string
}

export interface UpdateAddressDto {
  id?: string
  firstName?: string
  lastName?: string
  isDefault?: boolean
  company?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  zip?: string
  country?: string
  phone?: string
}

