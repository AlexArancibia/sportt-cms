export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDeliveryTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingMethodDto {
  name: string;
  description: string;
  price: number;
  estimatedDeliveryTime: string;
  isActive?: boolean;
}

export interface UpdateShippingMethodDto {
  name?: string;
  description?: string;
  price?: number;
  estimatedDeliveryTime?: string;
  isActive?: boolean;
}

