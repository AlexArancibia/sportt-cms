import { create } from 'zustand';
import { format } from 'date-fns';
import apiClient from '@/lib/axiosConfig';
import { extractApiData } from '@/lib/apiHelpers';
import type {
  CurrencyInfo,
  OverviewStats,
  SalesStats,
  ProductStats,
  CustomerStats,
  InventoryStats,
  TrendsStats,
  CompareStats,
  ConversionStats,
  ProfitableProduct,
  ProfitableProductsResponse,
  HourlySalesData,
  HourlySalesResponse,
  WeeklyPerformanceData,
  WeeklyPerformanceResponse,
} from '@/types/statistics';

// Re-export types for consumers that still import from the store
export type {
  CurrencyInfo,
  OverviewStats,
  SalesStats,
  ProductStats,
  CustomerStats,
  InventoryStats,
  TrendsStats,
  CompareStats,
  ConversionStats,
  ProfitableProduct,
  ProfitableProductsResponse,
  HourlySalesData,
  HourlySalesResponse,
  WeeklyPerformanceData,
  WeeklyPerformanceResponse,
} from '@/types/statistics';

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
  /** Internal: when true, individual fetch methods do not touch loading (used by fetchAllStatistics). */
  _batchMode?: boolean;

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
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/overview${params ? `?${params}` : ''}`;
      const response = await apiClient.get<OverviewStats>(url);
      const data = extractApiData(response);
      if (!get()._batchMode) set({ overview: data, loading: false, lastFetch: Date.now() });
      else set({ overview: data, lastFetch: Date.now() });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar overview';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
      throw error;
    }
  },

  // Fetch Sales
  fetchSales: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/sales${params ? `?${params}` : ''}`;
      const response = await apiClient.get<SalesStats>(url);
      const data = extractApiData(response);
      if (!get()._batchMode) set({ sales: data, loading: false });
      else set({ sales: data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar ventas';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
      throw error;
    }
  },

  // Fetch Products
  fetchProducts: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/products${params ? `?${params}` : ''}`;
      const response = await apiClient.get<ProductStats>(url);
      const data = extractApiData(response);
      if (!get()._batchMode) set({ products: data, loading: false });
      else set({ products: data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
      throw error;
    }
  },

  // Fetch Customers
  fetchCustomers: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = buildDateParams(startDate, endDate, currencyId);
      const url = `/statistics/${storeId}/customers${params ? `?${params}` : ''}`;
      const response = await apiClient.get<CustomerStats>(url);
      const data = extractApiData(response);
      if (!get()._batchMode) set({ customers: data, loading: false });
      else set({ customers: data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar clientes';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
      throw error;
    }
  },

  // Fetch Inventory
  fetchInventory: async (storeId: string, currencyId?: string) => {
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (currencyId) params.append('currencyId', currencyId);
      const url = `/statistics/${storeId}/inventory${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<InventoryStats>(url);
      const data = extractApiData(response);
      if (!get()._batchMode) set({ inventory: data, loading: false });
      else set({ inventory: data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar inventario';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
      throw error;
    }
  },

  // Fetch Trends
  fetchTrends: async (storeId: string, startDate?: Date | string, endDate?: Date | string, groupBy: string = 'day', currencyId?: string): Promise<TrendsStats> => {
    if (!get()._batchMode) set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(buildDateParams(startDate, endDate, currencyId));
      params.set('groupBy', (groupBy || 'day').toLowerCase());
      const query = params.toString();
      const url = `/statistics/${storeId}/trends${query ? `?${query}` : ''}`;
      const response = await apiClient.get(url);
      const data = extractApiData(response) as TrendsStats;
      if (!get()._batchMode) set({ trends: data, loading: false });
      else set({ trends: data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar tendencias';
      if (!get()._batchMode) set({ error: errorMessage, loading: false });
      else set({ error: errorMessage });
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
      const params = new URLSearchParams(buildDateParams(startDate, endDate, currencyId));
      params.set('limit', String(limit));
      const query = params.toString();
      const url = `/statistics/${storeId}/profitable-products${query ? `?${query}` : ''}`;
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

  // Fetch all main statistics at once (single loading state; inner fetches do not touch loading)
  fetchAllStatistics: async (storeId: string, startDate?: Date | string, endDate?: Date | string, currencyId?: string) => {
    set({ loading: true, error: null, _batchMode: true });
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
        _batchMode: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      set({ error: errorMessage, loading: false, _batchMode: false });
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
