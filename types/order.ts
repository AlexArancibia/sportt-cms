import type { Customer } from "./customer"
import type { Currency } from "./currency"
import type { Address } from "./address"
import type { Coupon } from "./coupon"
import type { PaymentProvider } from "./payments"
import type { ShippingMethod } from "./shippingMethod"
import type { Product } from "./product"
import type { ProductVariant } from "./productVariant"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "./common"

 

export interface Order {
  id: string
  customer?: Customer
  customerId?: string
  orderNumber: number
  financialStatus?: OrderFinancialStatus
  fulfillmentStatus?: OrderFulfillmentStatus
  currency: Currency
  currencyId: string
  totalPrice: number
  subtotalPrice: number
  totalTax: number
  totalDiscounts: number
  lineItems: OrderItem[]
  shippingAddressId?: string
  shippingAddress?: Address
  billingAddressId?: string
  billingAddress?: Address
  refunds: Refund[]
  coupon?: Coupon
  couponId?: string
  paymentProvider?: PaymentProvider
  paymentProviderId?: string
  paymentStatus?: string
  paymentDetails?: Record<string, any>
  shippingMethod?: ShippingMethod
  shippingMethodId?: string
  shippingStatus: ShippingStatus
  trackingNumber?: string
  trackingUrl?: string
  estimatedDeliveryDate?: string
  shippedAt?: string
  deliveredAt?: string
  customerNotes?: string
  internalNotes?: string
  source?: string
  preferredDeliveryDate?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  order: Order
  orderId: string
  product: Product
  productId: string
  variant?: ProductVariant
  variantId?: string
  title: string
  quantity: number
  price: number
  totalDiscount: number
  refundLineItems: RefundLineItem[]
  createdAt: string
  updatedAt: string
}

export interface Refund {
  id: string
  order: Order
  orderId: string
  amount: number
  note?: string
  restock: boolean
  processedAt?: string
  lineItems: RefundLineItem[]
  createdAt: string
  updatedAt: string
}

export interface RefundLineItem {
  id: string
  refund: Refund
  refundId: string
  orderItem: OrderItem
  orderItemId: string
  quantity: number
  amount: number
  restocked: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOrderItemDto {
  productId: string
  variantId?: string
  title: string
  quantity: number
  price: number
  totalDiscount?: number
}

export interface CreateOrderDto {
  customerId?: string
  email?: string
  phone?: string
  financialStatus?: OrderFinancialStatus
  fulfillmentStatus?: OrderFulfillmentStatus
  currencyId: string
  totalPrice: number
  subtotalPrice: number
  totalTax: number
  totalDiscounts: number
  lineItems: CreateOrderItemDto[]
  shippingAddressId?: string
  billingAddressId?: string
  couponId?: string
  paymentProviderId?: string
  paymentStatus?: string
  paymentDetails?: Record<string, any>
  shippingMethodId?: string
  shippingStatus?: ShippingStatus
  trackingNumber?: string
  trackingUrl?: string
  estimatedDeliveryDate?: string
  shippedAt?: string
  deliveredAt?: string
  customerNotes?: string
  internalNotes?: string
  source?: string
  preferredDeliveryDate?: string
}

export interface UpdateOrderDto {
  customerId?: string
  email?: string
  phone?: string
  financialStatus?: OrderFinancialStatus
  fulfillmentStatus?: OrderFulfillmentStatus
  totalPrice?: number
  subtotalPrice?: number
  totalTax?: number
  totalDiscounts?: number
  currencyId?: string
  shippingAddressId?: string
  billingAddressId?: string
  couponId?: string
  paymentProviderId?: string
  paymentStatus?: string
  paymentDetails?: Record<string, any>
  shippingMethodId?: string
  shippingStatus?: ShippingStatus
  trackingNumber?: string
  trackingUrl?: string
  estimatedDeliveryDate?: string
  shippedAt?: string
  deliveredAt?: string
  customerNotes?: string
  internalNotes?: string
  source?: string
  preferredDeliveryDate?: string
}

export interface CreateRefundDto {
  orderId: string
  amount: number
  note?: string
  restock: boolean
  lineItems: Array<{
    orderItemId: string
    quantity: number
    amount: number
    restocked: boolean
  }>
}