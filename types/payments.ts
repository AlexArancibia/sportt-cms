import { Currency } from "./currency";
import { Order } from "./order";
import { Store } from "./store"; // Asumiendo que existe la interfaz Store

export enum PaymentProviderType {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  MERCADOPAGO = "MERCADOPAGO",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY", // Añadido según schema
  OTHER = "OTHER",
}

export enum PaymentStatus { // Añadido según schema
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface PaymentProvider {
  id: string;
  storeId: string; // Añadido según schema
  store?: Store; // Relación opcional
  name: string;
  type: PaymentProviderType;
  description?: string | null;
  isActive: boolean;
  credentials?: Record<string, any> | null; // Cambiado a any para mayor flexibilidad
  minimumAmount?: number | null; // Añadido según schema
  maximumAmount?: number | null; // Añadido según schema
  testMode?: boolean | null; // Añadido según schema
  imgUrl?: string | null; // Añadido según schema
  currencyId: string;
  currency: Currency;
  orders?: Order[]; // Relación opcional
  paymentTransactions?: PaymentTransaction[]; // Relación opcional
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  order: Order;
  paymentProviderId: string;
  paymentProvider: PaymentProvider;
  amount: number;
  currencyId: string;
  currency: Currency;
  status: PaymentStatus; // Usando el enum definido
  transactionId?: string | null;
  paymentMethod?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null; // Cambiado a any
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface CreatePaymentProviderDto {
  storeId: string; // Requerido según schema
  name: string;
  type: PaymentProviderType;
  description?: string;
  isActive?: boolean;
  credentials?: Record<string, any>;
  minimumAmount?: number;
  maximumAmount?: number;
  testMode?: boolean;
  imgUrl?: string;
  currencyId: string;
}

export interface UpdatePaymentProviderDto {
  name?: string;
  type?: PaymentProviderType;
  description?: string | null;
  isActive?: boolean;
  credentials?: Record<string, any> | null;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  testMode?: boolean | null;
  imgUrl?: string | null;
  currencyId?: string;
}

export interface CreatePaymentTransactionDto {
  orderId: string;
  paymentProviderId: string;
  amount: number;
  currencyId: string;
  status: PaymentStatus; // Usando el enum
  transactionId?: string;
  paymentMethod?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentTransactionDto {
  status?: PaymentStatus; // Usando el enum
  transactionId?: string | null;
  paymentMethod?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
}