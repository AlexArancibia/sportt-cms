import { create } from 'zustand';
import { format } from 'date-fns';
import apiClient from '@/lib/axiosConfig';
import { extractApiData } from '@/lib/apiHelpers';

// ============== INTERFACES ==============

// Currency Info (from backend responses)
export interface CurrencyInfo {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

// Overview Response (actual structure from backend)
export interface OverviewStats {
  currency?: CurrencyInfo;
  totalOrders: number;
  totalRevenue: string | number;
  averageOrderValue: string | number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  completedOrders: number;
  fulfillmentRate: number;
  // Comparison fields (optional, only present when startDate and endDate are provided)
  comparison?: {
    totalOrders: { current: number; previous: number; growth: number };
    totalRevenue: { current: number; previous: number; growth: number };
    totalCustomers: { current: number; previous: number; growth: number };
    averageOrderValue: { current: number; previous: number; growth: number };
  };
  comparisonType?: string; // e.g., "5 días", "enero", "año 2024"
}

// Sales Response (actual structure from backend)
export interface SalesStats {
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  currency?: CurrencyInfo;
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
  totalRevenue: number;
  totalUnitsSold: number;
  averagePrice: number;
  cost: number;
  profit: number;
  margin: number;
}

// Hourly Sales Response
export interface HourlySalesData {
  hour: number;
  hourLabel?: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

// Weekly Performance Response (actual structure from backend)
export interface WeeklyPerformanceData {
  day: number;
  dayName: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

// Wrapper interfaces for array responses with currency
export interface ArrayResponseWithCurrency<T> {
  currency: CurrencyInfo;
  data: T[];
}

// Special wrapper for profitable products (uses "products" instead of "data")
export interface ProfitableProductsResponse {
  currency: CurrencyInfo;
  products: ProfitableProduct[];
}

export type WeeklyPerformanceResponse = ArrayResponseWithCurrency<WeeklyPerformanceData>;
export type HourlySalesResponse = ArrayResponseWithCurrency<HourlySalesData>;

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
  // Aceptan Date o string (formato YYYY-MM-DD) para evitar problemas de zona horaria
  fetchOverview: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<OverviewStats>;
  fetchSales: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<SalesStats>;
  fetchProducts: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<ProductStats>;
  fetchCustomers: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<CustomerStats>;
  fetchInventory: (storeId: string, currencyId?: string) => Promise<InventoryStats>;
  fetchTrends: (storeId: string, startDate?: Date | string, endDate?: Date | string, groupBy?: string, currencyId?: string) => Promise<TrendsStats>;
  fetchCompare: (
    storeId: string,
    period1Start: Date | string,
    period1End: Date | string,
    period2Start: Date | string,
    period2End: Date | string,
    currencyId?: string
  ) => Promise<CompareStats>;
  fetchConversion: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<ConversionStats>;
  fetchProfitableProducts: (storeId: string, startDate?: Date | string, endDate?: Date | string, limit?: number, currencyId?: string) => Promise<ProfitableProduct[]>;
  fetchHourlySales: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<HourlySalesData[]>;
  fetchWeeklyPerformance: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<WeeklyPerformanceData[]>;

  // Fetch all main statistics at once
  fetchAllStatistics: (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => Promise<void>;

  // Legacy methods
  fetchStatistics: (storeId: string) => Promise<LegacyStatisticsData>;
  setData: (data: LegacyStatisticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Clear all data
  clearStatistics: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

// Helper to build query params - format dates as YYYY-MM-DD
// Acepta Date o string (formato YYYY-MM-DD) para evitar problemas de zona horaria
const buildDateParams = (startDate?: Date | string, endDate?: Date | string, currencyId?: string): string => {
  const params = new URLSearchParams();
  
  if (startDate) {
    params.append('startDate', typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd'));
  }
  if (endDate) {
    params.append('endDate', typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd'));
  }
  if (currencyId) params.append('currencyId', currencyId);
  
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
  fetchOverview: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
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
  fetchSales: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
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
  fetchProducts: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
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
  fetchCustomers: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
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
  fetchInventory: async (storeId: string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (currencyId) params.append('currencyId', currencyId);
      const url = `/statistics/${storeId}/inventory${params.toString() ? `?${params.toString()}` : ''}`;
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
  fetchTrends: async (storeId: string, startDate?: Date | string, endDate?: Date | string, groupBy: string = 'day', currencyId?: string): Promise<TrendsStats> => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const groupByParam = params ? '&' : '?';
      const url = `/statistics/${storeId}/trends${params ? `?${params}` : ''}${groupByParam}groupBy=${groupBy.toLowerCase()}`;
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
    period1Start: Date | string,
    period1End: Date | string,
    period2Start: Date | string,
    period2End: Date | string,
    currencyId?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      const formatDate = (date: Date | string) => typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      params.append('period1Start', formatDate(period1Start));
      params.append('period1End', formatDate(period1End));
      params.append('period2Start', formatDate(period2Start));
      params.append('period2End', formatDate(period2End));
      if (currencyId) params.append('currencyId', currencyId);
      const url = `/statistics/${storeId}/compare?${params}`;
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
  fetchConversion: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
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
  fetchProfitableProducts: async (storeId: string, startDate?: Date | string, endDate?: Date | string, limit: number = 10, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const limitParam = params ? '&' : '?';
      const url = `/statistics/${storeId}/profitable-products${params ? `?${params}` : ''}${limitParam}limit=${limit}`;
      const response = await apiClient.get<ProfitableProductsResponse>(url);
      const responseData = extractApiData(response) as ProfitableProductsResponse;
      set({ profitableProducts: responseData.products, loading: false });
      return responseData.products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos rentables';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Hourly Sales
  fetchHourlySales: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/hourly${params ? `?${params}` : ''}`;
      const response = await apiClient.get<HourlySalesResponse>(url);
      const responseData = extractApiData(response) as unknown as HourlySalesResponse;
      const data = responseData.data;
      set({ hourlySales: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar ventas por hora';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch Weekly Performance
  fetchWeeklyPerformance: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/weekly${params ? `?${params}` : ''}`;
      const response = await apiClient.get<WeeklyPerformanceResponse>(url);
      const responseData = extractApiData(response) as unknown as WeeklyPerformanceResponse;
      const data = responseData.data;
      set({ weeklyPerformance: data, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar rendimiento semanal';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch all main statistics at once
  fetchAllStatistics: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [overview, sales, products, customers, inventory, trends] = await Promise.all([
        get().fetchOverview(storeId, startDate, endDate, currencyId),
        get().fetchSales(storeId, startDate, endDate, currencyId),
        get().fetchProducts(storeId, startDate, endDate, currencyId),
        get().fetchCustomers(storeId, startDate, endDate, currencyId),
        get().fetchInventory(storeId, currencyId),
        get().fetchTrends(storeId, startDate, endDate, 'day', currencyId),
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
