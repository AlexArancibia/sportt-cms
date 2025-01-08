import { OrderFinancialStatus, OrderFulfillmentStatus } from './common';

export interface Order {
  id: string;
  customerId?: string;
  orderNumber: number;
  email?: string;
  phone?: string;
  financialStatus?: OrderFinancialStatus;
  fulfillmentStatus?: OrderFulfillmentStatus;
  currency: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentProviderId?: string;
  shippingMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  customerId?: string;
  email?: string;
  phone?: string;
  currency: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentProviderId?: string;
  shippingMethodId?: string;
}

export interface UpdateOrderDto {
  email?: string;
  phone?: string;
  financialStatus?: OrderFinancialStatus;
  fulfillmentStatus?: OrderFulfillmentStatus;
  currency?: string;
  totalPrice?: number;
  subtotalPrice?: number;
  totalTax?: number;
  totalDiscounts?: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentProviderId?: string;
  shippingMethodId?: string;
}

