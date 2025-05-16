import type { Product } from "./product";
import type { Category } from "./category";
import type { Collection } from "./collection";
import type { Order } from "./order";
import type { Store } from "./store"; // Asumiendo que existe la interfaz Store
import { DiscountType } from "./common";

 
export interface Coupon {
  id: string;
  storeId: string; // Añadido según schema
  store?: Store; // Relación opcional
  code: string;
  description?: string ;
  type: DiscountType;
  value: number;
  minPurchase?: number ;
  maxUses?: number ;
  usedCount: number;
  startDate: Date; // Cambiado a Date
  endDate: Date; // Cambiado a Date
  isActive: boolean;
  applicableProducts?: Product[]; // Relación opcional
  applicableCategories?: Category[]; // Relación opcional
  applicableCollections?: Collection[]; // Relación opcional
  orders?: Order[]; // Relación opcional
  createdAt: Date; // Cambiado a Date
  updatedAt: Date; // Cambiado a Date
}

export interface CreateCouponDto {
  storeId: string; // Requerido según schema
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchase?: number;
  maxUses?: number;
  startDate: Date; // Cambiado a Date
  endDate: Date; // Cambiado a Date
  isActive?: boolean;
  applicableProductIds?: string[]; // IDs en lugar de objetos completos
  applicableCategoryIds?: string[]; // IDs en lugar de objetos completos
  applicableCollectionIds?: string[]; // IDs en lugar de objetos completos
}

export interface UpdateCouponDto {
  code?: string;
  description?: string ;
  type?: DiscountType;
  value?: number;
  minPurchase?: number ;
  maxUses?: number ;
  usedCount?: number;
  startDate?: Date; // Cambiado a Date
  endDate?: Date; // Cambiado a Date
  isActive?: boolean;
  applicableProductIds?: string[]; // IDs en lugar de objetos completos
  applicableCategoryIds?: string[]; // IDs en lugar de objetos completos
  applicableCollectionIds?: string[]; // IDs en lugar de objetos completos
}