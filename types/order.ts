import { Store } from "./store";
import { Currency } from "./currency";
import { Coupon } from "./coupon";
import { PaymentProvider, PaymentTransaction } from "./payments";
import { ShippingMethod } from "./shippingMethod";
import { ProductVariant } from "./productVariant";
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus, PaymentStatus } from "./common";


export interface CustomerInfo {
  userId?: string;       // ID opcional para referencia
  name?: string;         // Nombre completo del cliente
  email?: string;        // Correo electrónico
  phone?: string;        // Número de teléfono
  company?: string;      // Empresa (opcional)
  taxId?: string;        // NIF/CIF para facturación
}
export interface AddressInfo {
  name?: string;         // Nombre del destinatario
  address1?: string;     // Dirección principal
  address2?: string;     // Dirección secundaria (opcional)
  city?: string;         // Ciudad
  state?: string;        // Provincia/Estado
  postalCode?: string;   // Código postal
  country?: string;      // País
  phone?: string;        // Teléfono de contacto
}

export interface Order {
  id: string;
  storeId: string;
  store?: Store;
  orderNumber: number;
  customerInfo: Record<string, any>; // Json en schema
  financialStatus?: OrderFinancialStatus | null;
  fulfillmentStatus?: OrderFulfillmentStatus | null;
  currencyId: string;
  currency: Currency;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  lineItems: OrderItem[];
  shippingAddress?: Record<string, any> | null; // Json en schema
  billingAddress?: Record<string, any> | null; // Json en schema
  refunds: Refund[];
  couponId?: string | null;
  coupon?: Coupon | null;
  paymentProviderId?: string | null;
  paymentProvider?: PaymentProvider | null;
  paymentStatus?: PaymentStatus | null;
  paymentDetails?: Record<string, any> | null; // Json en schema
  shippingMethodId?: string | null;
  shippingMethod?: ShippingMethod | null;
  shippingStatus: ShippingStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  source?: string | null;
  preferredDeliveryDate?: Date | null;
  paymentTransactions?: PaymentTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  order?: Order;
  variantId?: string | null;
  variant?: ProductVariant | null;
  title: string;
  quantity: number;
  price: number;
  totalDiscount: number;
  refundLineItems: RefundLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  orderId: string;
  order?: Order;
  amount: number;
  note?: string | null;
  restock: boolean;
  processedAt?: Date | null;
  lineItems: RefundLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundLineItem {
  id: string;
  refundId: string;
  refund?: Refund;
  orderItemId: string;
  orderItem?: OrderItem;
  quantity: number;
  amount: number;
  restocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderItemDto {
  variantId?: string; // Opcional según schema
  title: string;
  quantity: number;
  price: number;
  totalDiscount?: number;
}

export interface CreateOrderDto {
  orderNumber: number
  storeId: string; // Requerido según schema
  customerInfo: Record<string, any>;
  financialStatus?: OrderFinancialStatus;
  fulfillmentStatus?: OrderFulfillmentStatus;
  currencyId: string;
  totalPrice: number;
  subtotalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  lineItems: CreateOrderItemDto[];
  shippingAddress?: Record<string, any>;
  billingAddress?: Record<string, any>;
  couponId?: string;
  paymentProviderId?: string;
  paymentStatus?: PaymentStatus;
  paymentDetails?: Record<string, any>;
  shippingMethodId?: string;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  customerNotes?: string;
  internalNotes?: string;
  source?: string;
  preferredDeliveryDate?: Date;
}

export interface UpdateOrderDto {
  orderNumber: number
  customerInfo?: Record<string, any>;
  financialStatus?: OrderFinancialStatus | null;
  fulfillmentStatus?: OrderFulfillmentStatus | null;
  totalPrice?: number;
  subtotalPrice?: number;
  totalTax?: number;
  totalDiscounts?: number;
  lineItems?: UpdateOrderItemDto[];
  currencyId?: string;
  shippingAddress?: Record<string, any> | null;
  billingAddress?: Record<string, any> | null;
  couponId?: string | null;
  paymentProviderId?: string | null;
  paymentStatus?: PaymentStatus | null;
  paymentDetails?: Record<string, any> | null;
  shippingMethodId?: string | null;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  customerNotes?: string | null;
  internalNotes?: string | null;
  source?: string | null;
  preferredDeliveryDate?: Date | null;
}

export interface UpdateOrderItemDto {
  variantId?: string | null; // Opcional según schema
  title?: string;
  quantity?: number;
  price?: number;
  totalDiscount?: number;
}

export interface CreateRefundDto {
  orderId: string;
  amount: number;
  note?: string;
  restock: boolean;
  lineItems: Array<{
    orderItemId: string;
    quantity: number;
    amount: number;
    restocked: boolean;
  }>;
}