// Enums
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED'
}

export enum FulfillmentStatus {
  NOT_FULFILLED = 'NOT_FULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  CANCELED = 'CANCELED'
}

// DTO for OrderItems
export interface OrderItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number ;
}

// DTO for creating an order
export interface CreateOrderDto {
  customerId: string;
  orderItems: OrderItemDto[];
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  phone: number;
  address: string;
  discount?: number ;
  couponId?: string;
  shippingMethodId: string;
  subtotal: number ;
  total: number ;
  note?: string;
  tags?: string[];
}

// DTO for updating an order
export interface UpdateOrderDto {
  customerId?: string;
  orderItems?: OrderItemDto[];
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  phone?: number;
  address?: string;
  discount?: number ;
  couponId?: string;
  shippingMethodId?: string;
  subtotal?: number ;
  total?: number ;
  note?: string;
  tags?: string[];
}

// Full Order type (for reference)
export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  orderItems: OrderItemDto[];
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  phone: number;
  address: string;
  discount: number ;
  couponId?: string;
  shippingMethodId: string;
  subtotal: number ;
  total: number ;
  note?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

