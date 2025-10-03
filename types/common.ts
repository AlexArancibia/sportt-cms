// Common enums
export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
  FACEBOOK = "FACEBOOK",
  TWITTER = "TWITTER",
  APPLE = "APPLE",
  GITHUB = "GITHUB",
  CUSTOM = "CUSTOM"
}


export enum CurrencyPosition {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER'
}

export enum OrderFinancialStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  VOIDED = 'VOIDED'
}

 
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum OrderFulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  RESTOCKED = 'RESTOCKED',
  PENDING_FULFILLMENT = 'PENDING_FULFILLMENT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  SCHEDULED = 'SCHEDULED'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  FAILURE = 'FAILURE'
}

export enum PaymentProviderType {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  MERCADOPAGO = 'MERCADOPAGO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  CULQI = 'CULQI',
  IZIPAY = 'IZIPAY',
  NIUBIZ = 'NIUBIZ',
  OTHER = 'OTHER'
}

export enum ShippingMethodType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  FREE = 'FREE',
  PICKUP = 'PICKUP',
  CUSTOM = 'CUSTOM'
}
export enum ShippingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
}

export enum ContentType {
  ARTICLE = "ARTICLE",
  BLOG = "BLOG",
  PAGE = "PAGE",
  NEWS = "NEWS",
}


export enum MovementType {
  COMPRA = 'COMPRA',
  VENTA = 'VENTA',
  DEVOLUCION = 'DEVOLUCION',
  AJUSTE = 'AJUSTE'
}

export enum InvoiceType {
  FACTURA = 'FACTURA',
  BOLETA = 'BOLETA'
}

export enum SeoPageType {
  HOME = 'HOME',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  COLLECTION = 'COLLECTION',
  BLOG = 'BLOG',
  PAGE = 'PAGE',
  CUSTOM = 'CUSTOM'
}

export enum SeoRobotsDirective {
  INDEX_FOLLOW = 'INDEX_FOLLOW',
  INDEX_NOFOLLOW = 'INDEX_NOFOLLOW',
  NOINDEX_FOLLOW = 'NOINDEX_FOLLOW',
  NOINDEX_NOFOLLOW = 'NOINDEX_NOFOLLOW'
}

export enum SeoChangeFrequency {
  ALWAYS = 'ALWAYS',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  NEVER = 'NEVER'
}


export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EDITOR = 'EDITOR',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE'
}

// Common interfaces
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

