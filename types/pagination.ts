// Tipos base para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Respuesta paginada del backend
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Parámetros específicos por recurso
export interface ProductSearchParams extends PaginationParams {
  query?: string;
  storeId?: string;
  status?: string[];
  vendor?: string;
  categoryIds?: string[];
  collectionIds?: string[];
}

export interface CollectionSearchParams extends PaginationParams {
  query?: string;
  storeId?: string;
  includeInactive?: boolean;
}

export interface ContentSearchParams extends PaginationParams {
  query?: string;
  storeId?: string;
  type?: string;
  category?: string;
  published?: boolean;
}

export interface OrderSearchParams extends PaginationParams {
  storeId?: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface CouponSearchParams extends PaginationParams {
  query?: string;
  storeId?: string;
  includeInactive?: boolean;
}

// Estado de paginación para componentes
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
}

// Acciones de paginación
export type PaginationAction = 
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_LIMIT'; limit: number }
  | { type: 'SET_SORT'; sortBy: string; sortOrder: 'asc' | 'desc' }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'GO_TO_FIRST' }
  | { type: 'GO_TO_LAST' };