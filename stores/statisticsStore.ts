import { create } from 'zustand';
import apiClient from '@/lib/axiosConfig';
import { extractApiData } from '@/lib/apiHelpers';

// ============== INTERFACES ==============

// Overview Response (actual structure from backend)
export interface OverviewStats {
  totalOrders: number;
  totalRevenue: string | number;
  averageOrderValue: string | number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  completedOrders: number;
  fulfillmentRate: number;
}

// Sales Response (actual structure from backend)
export interface SalesStats {
  ordersByStatus: Array<{
    status: string;
    count: number;
    totalAmount: string | number;
  }>;
  revenueBreakdown: {
    subtotal: string | number;
    tax: string | number;
    discount: string | number;
    total: string | number;
  };
  salesByPaymentMethod: Array<{
    paymentProviderId: string;
    providerName: string;
    orderCount: number;
    totalRevenue: string | number;
  }>;
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    unitsSold: number;
  }>;
  refundStats: {
    totalRefunds: number;
    totalRefundAmount: number;
    refundRate: number;
  };
}

// Products Response (actual structure from backend)
export interface ProductStats {
  productsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topSellingProducts: Array<{
    variantId: string;
    productId: string;
    productTitle: string;
    productSlug: string;
    variantTitle: string;
    sku: string;
    imageUrl: string;
    quantitySold: number;
    revenue: string | number;
  }>;
  lowStockProducts: Array<{
    variantId: string;
    productId: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    currentStock: number;
    status: string;
  }>;
  inventoryValue: {
    totalValue: number;
    totalUnits: number;
    averageUnitValue: number;
  };
  productsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
  }>;
}

// Customers Response (actual structure from backend)
export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageCustomerValue: number;
  customerRetentionRate: number;
  topCustomers: Array<{
    email: string;
    orderCount: number;
    totalSpent: number;
    lastOrder: string;
  }>;
}

// Inventory Response (actual structure from backend)
export interface InventoryStats {
  totalVariants: number;
  inStockVariants: number;
  outOfStockVariants: number;
  lowStockCount: number;
  inventoryValue: {
    totalValue: number;
    totalUnits: number;
    averageUnitValue: number;
  };
  lowStockVariants: Array<{
    variantId: string;
    productId: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    currentStock: number;
    status: string;
  }>;
  topInventoryProducts?: Array<{
    variantId: string;
    productId: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
  }>;
}

// Trends Response
export interface TrendDataPoint {
  period: string;
  revenue: number;
  orderCount: number;
  paidCount: number;
  averageOrderValue: number;
}

export interface TrendsStats {
  period: string;
  startDate: string;
  endDate: string;
  data: TrendDataPoint[];
}

// Compare Periods Response
export interface ComparePeriodData {
  orders: number;
  revenue: number;
  averageOrderValue: number;
  customers: number;
}

export interface CompareStats {
  period1: ComparePeriodData;
  period2: ComparePeriodData;
  growth: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
    customers: number;
  };
}

// Conversion Response
export interface ConversionStats {
  paymentConversion: {
    total: number;
    paid: number;
    rate: number;
  };
  fulfillmentConversion: {
    total: number;
    fulfilled: number;
    rate: number;
  };
  cancellationRate: {
    total: number;
    cancelled: number;
    rate: number;
  };
  refundRate: {
    total: number;
    refunded: number;
    rate: number;
  };
  productPerformance: {
    totalProducts: number;
    productsWithSales: number;
    conversionRate: number;
  };
}

// Profitable Products Response
export interface ProfitableProduct {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

// Hourly Sales Response
export interface HourlySalesData {
  hour: number;
  orderCount: number;
  totalRevenue: number;
}

// Weekly Performance Response (actual structure from backend)
export interface WeeklyPerformanceData {
  day: number;
  dayName: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

// Legacy interfaces for backward compatibility
interface InventarioVariante {
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  valorTotal: number;
  costoUnitario: number;
  [key: string]: unknown;
}

interface InventarioProducto {
  producto: string;
  variantes: InventarioVariante[];
  [key: string]: unknown;
}

interface ProductoMasVendido {
  nombre: string;
  fecha?: string;
  [key: string]: unknown;
}

interface VentaPorPeriodo {
  fecha: string;
  [key: string]: unknown;
}

interface AlertaStockBajo {
  [key: string]: unknown;
}

interface LegacyStatisticsData {
  inventarioActual?: InventarioProducto[];
  productosMasVendidos?: ProductoMasVendido[];
  valorInventarioTotal?: number;
  alertasStockBajo?: AlertaStockBajo[];
  ventasPorPeriodo?: VentaPorPeriodo[];
  [key: string]: unknown;
}

// ============== STATE INTERFACE ==============

interface StatisticsState {
  // New statistics data
  overview: OverviewStats | null;
  sales: SalesStats | null;
  products: ProductStats | null;
  customers: CustomerStats | null;
  inventory: InventoryStats | null;
  trends: TrendsStats | null;
  compare: CompareStats | null;
  conversion: ConversionStats | null;
  profitableProducts: ProfitableProduct[] | null;
  hourlySales: HourlySalesData[] | null;
  weeklyPerformance: WeeklyPerformanceData[] | null;

  // Legacy data (for backward compatibility)
  data: LegacyStatisticsData | null;

  // State management
  loading: boolean;
  error: string | null;
  lastFetch: number | null;

  // New fetch methods
  fetchOverview: (storeId: string, startDate?: Date, endDate?: Date) => Promise<OverviewStats>;
  fetchSales: (storeId: string, startDate?: Date, endDate?: Date) => Promise<SalesStats>;
  fetchProducts: (storeId: string, startDate?: Date, endDate?: Date) => Promise<ProductStats>;
  fetchCustomers: (storeId: string, startDate?: Date, endDate?: Date) => Promise<CustomerStats>;
  fetchInventory: (storeId: string) => Promise<InventoryStats>;
  fetchTrends: (storeId: string, startDate?: Date, endDate?: Date, groupBy?: string) => Promise<TrendsStats>;
  fetchCompare: (
    storeId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) => Promise<CompareStats>;
  fetchConversion: (storeId: string, startDate?: Date, endDate?: Date) => Promise<ConversionStats>;
  fetchProfitableProducts: (storeId: string, startDate?: Date, endDate?: Date, limit?: number) => Promise<ProfitableProduct[]>;
  fetchHourlySales: (storeId: string, startDate?: Date, endDate?: Date) => Promise<HourlySalesData[]>;
  fetchWeeklyPerformance: (storeId: string, startDate?: Date, endDate?: Date) => Promise<WeeklyPerformanceData[]>;

  // Fetch all main statistics at once
  fetchAllStatistics: (storeId: string, startDate?: Date, endDate?: Date) => Promise<void>;

  // Legacy methods
  fetchStatistics: (storeId: string) => Promise<LegacyStatisticsData>;
  setData: (data: LegacyStatisticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Clear all data
  clearStatistics: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

// Helper to build query params
const buildDateParams = (startDate?: Date, endDate?: Date): string => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  return params.toString();
};

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  // Initial state
  overview: null,
  sales: null,
  products: null,
  customers: null,
  inventory: null,
  trends: null,
  compare: null,
  conversion: null,
  profitableProducts: null,
  hourlySales: null,
  weeklyPerformance: null,
  data: null,
  loading: false,
  error: null,
  lastFetch: null,

  // Setters
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Clear all statistics
  clearStatistics: () =>
    set({
      overview: null,
      sales: null,
      products: null,
      customers: null,
      inventory: null,
      trends: null,
      compare: null,
      conversion: null,
      profitableProducts: null,
      hourlySales: null,
      weeklyPerformance: null,
      data: null,
      error: null,
    }),

  // Fetch Overview
  fetchOverview: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/overview${params ? `?${params}` : ''}`;
      const response = await apiClient.get<OverviewStats>(url);
      const data = extractApiData(response);
      set({ overview: data, loading: false, lastFetch: Date.now() });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar overview';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Sales
  fetchSales: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/sales${params ? `?${params}` : ''}`;
      const response = await apiClient.get<SalesStats>(url);
      const data = extractApiData(response);
      set({ sales: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar ventas';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Products
  fetchProducts: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/products${params ? `?${params}` : ''}`;
      const response = await apiClient.get<ProductStats>(url);
      const data = extractApiData(response);
      set({ products: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Customers
  fetchCustomers: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/customers${params ? `?${params}` : ''}`;
      const response = await apiClient.get<CustomerStats>(url);
      const data = extractApiData(response);
      set({ customers: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar clientes';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Inventory
  fetchInventory: async (storeId: string) => {
    set({ loading: true, error: null });
    try {
      const url = `/statistics/${storeId}/inventory`;
      const response = await apiClient.get<InventoryStats>(url);
      const data = extractApiData(response);
      set({ inventory: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar inventario';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Trends
  fetchTrends: async (storeId: string, startDate?: Date, endDate?: Date, groupBy: string = 'day'): Promise<TrendsStats> => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('groupBy', groupBy);
      const url = `/statistics/${storeId}/trends?${params.toString()}`;
      const response = await apiClient.get(url);
      const data = extractApiData(response) as TrendsStats;
      set({ trends: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar tendencias';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Compare
  fetchCompare: async (
    storeId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('period1Start', period1Start.toISOString());
      params.append('period1End', period1End.toISOString());
      params.append('period2Start', period2Start.toISOString());
      params.append('period2End', period2End.toISOString());
      const url = `/statistics/${storeId}/compare?${params.toString()}`;
      const response = await apiClient.get<CompareStats>(url);
      const data = extractApiData(response);
      set({ compare: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al comparar períodos';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Conversion
  fetchConversion: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/conversion${params ? `?${params}` : ''}`;
      const response = await apiClient.get<ConversionStats>(url);
      const data = extractApiData(response);
      set({ conversion: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar conversión';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Profitable Products
  fetchProfitableProducts: async (storeId: string, startDate?: Date, endDate?: Date, limit: number = 10) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('limit', limit.toString());
      const url = `/statistics/${storeId}/profitable-products?${params.toString()}`;
      const response = await apiClient.get<ProfitableProduct[]>(url);
      const data = extractApiData(response);
      set({ profitableProducts: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos rentables';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Hourly Sales
  fetchHourlySales: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/hourly${params ? `?${params}` : ''}`;
      const response = await apiClient.get<HourlySalesData[]>(url);
      const data = extractApiData(response);
      set({ hourlySales: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar ventas por hora';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Weekly Performance
  fetchWeeklyPerformance: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate);
      const url = `/statistics/${storeId}/weekly${params ? `?${params}` : ''}`;
      const response = await apiClient.get<WeeklyPerformanceData[]>(url);
      const data = extractApiData(response);
      set({ weeklyPerformance: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar rendimiento semanal';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch all main statistics at once
  fetchAllStatistics: async (storeId: string, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: null });
    try {
      const [overview, sales, products, customers, inventory, trends] = await Promise.all([
        get().fetchOverview(storeId, startDate, endDate),
        get().fetchSales(storeId, startDate, endDate),
        get().fetchProducts(storeId, startDate, endDate),
        get().fetchCustomers(storeId, startDate, endDate),
        get().fetchInventory(storeId),
        get().fetchTrends(storeId, startDate, endDate, 'day'),
      ]);
      set({
        overview,
        sales,
        products,
        customers,
        inventory,
        trends,
        loading: false,
        lastFetch: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Legacy fetch method
  fetchStatistics: async (storeId: string) => {
    const { lastFetch, data } = get();
    const now = Date.now();
    if (data && lastFetch && now - lastFetch < CACHE_DURATION) {
      return data;
    }
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<LegacyStatisticsData>(`/orders/${storeId}/statistics`);
      const statisticsData = extractApiData(response);
      set({ data: statisticsData, loading: false, lastFetch: now });
      return statisticsData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
