import { Currency } from "./currency"
import { Order } from "./order"

export enum PaymentProviderType {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  MERCADOPAGO = "MERCADOPAGO",
  BANK_TRANSFER = "BANK_TRANSFER",
  OTHER = "OTHER",
}

export interface PaymentProvider {
  id: string
  name: string
  type: PaymentProviderType
  description?: string
  isActive: boolean
  credentials?: Record<string, string>
  currencyId: string
  currency: Currency
  createdAt: string
  updatedAt: string
}

export interface PaymentTransaction {
  id: string
  orderId: string
  order: Order
  paymentProviderId: string
  paymentProvider: PaymentProvider
  amount: number
  currencyId: string
  currency: Currency
  status: string
  transactionId?: string
  paymentMethod?: string
  errorMessage?: string
  metadata?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentProviderDto {
  name: string
  type: PaymentProviderType
  description?: string
  isActive: boolean
  credentials?: Record<string, string>
  currencyId: string
}

export interface UpdatePaymentProviderDto {
  id? : string
  name?: string
  type?: PaymentProviderType
  description?: string
  isActive?: boolean
  credentials?: Record<string, string>
  currencyId?: string
}

export interface CreatePaymentTransactionDto {
  orderId: string
  paymentProviderId: string
  amount: number
  currencyId: string
  status: string
  transactionId?: string
  paymentMethod?: string
  errorMessage?: string
  metadata?: Record<string, string>
}

export interface UpdatePaymentTransactionDto {
  status?: string
  transactionId?: string
  paymentMethod?: string
  errorMessage?: string
  metadata?: Record<string, string>
}

