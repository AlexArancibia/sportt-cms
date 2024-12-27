import { Order } from './order';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: number | null;
  address: string;
  password?: string; // No incluimos la contraseña en la interfaz principal por seguridad
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: number | null;
  address: string;
  password: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: number | null;
  address?: string;
  password?: string;
}

