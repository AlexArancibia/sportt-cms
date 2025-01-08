import { PaymentProviderType } from './common';

export interface PaymentProvider {
  id: string;
  name: string;
  type: PaymentProviderType;
  description?: string;
  isActive: boolean;
  credentials?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentProviderDto {
  name: string;
  type: PaymentProviderType;
  description?: string;
  isActive?: boolean;
  credentials?: Record<string, any>;
}

export interface UpdatePaymentProviderDto {
  name?: string;
  type?: PaymentProviderType;
  description?: string;
  isActive?: boolean;
  credentials?: Record<string, any>;
}

