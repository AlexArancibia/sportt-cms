export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  conditions: any; // You might want to define a more specific type for conditions
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponDto {
  code: string;
  description: string;
  discount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  conditions?: any;
}

export interface UpdateCouponDto {
  code?: string;
  description?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  conditions?: any;
}

