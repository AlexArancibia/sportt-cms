import { create } from 'zustand';
import apiClient from '@/lib/axiosConfig';
import { extractApiData } from '@/lib/apiHelpers';

export interface KardexMovimiento {
  fecha: string;
  tipo: string;
  referencia: string;
  entrada: number;
  salida: number;
  stockFinal: number;
  costoUnitario: number;
  costoTotal: number;
}

export interface KardexResumen {
  stockInicial: number;
  totalEntradas: number;
  totalSalidas: number;
  stockFinal: number;
  valorTotal: number;
  costoUnitarioPromedio: number;
}

export interface KardexVariante {
  id: string;
  sku: string;
  nombre: string;
  movimientos: KardexMovimiento[];
  resumen: KardexResumen;
}

export interface KardexProducto {
  producto: {
    id: string;
    nombre: string;
    categorias: string[];
  };
  variantes: KardexVariante[];
}

export interface KardexFilters {
  dateFrom: string;
  dateTo: string;
  movementType: string;
  category: string;
  variantId: string;
  productId: string;
  page: number;
  pageSize: number;
}

interface KardexStore {
  kardexData: KardexProducto[];
  filteredData: KardexProducto[];
  filters: KardexFilters;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  fetchKardex: (storeId: string) => Promise<KardexProducto[]>;
  setKardexData: (data: KardexProducto[]) => void;
  setFilters: (filters: Partial<KardexFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

const initialFilters: KardexFilters = {
  dateFrom: '',
  dateTo: '',
  movementType: 'all',
  category: 'all',
  variantId: 'all',
  productId: 'all',
  page: 1,
  pageSize: 10,
};

export const useKardexStore = create<KardexStore>((set, get) => ({
  kardexData: [],
  filteredData: [],
  filters: initialFilters,
  loading: false,
  error: null,
  lastFetch: null,
  setKardexData: (data) => set({ kardexData: data, filteredData: data }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () => set({ filters: initialFilters, filteredData: get().kardexData }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  fetchKardex: async (storeId: string) => {
    const { lastFetch, kardexData } = get();
    const now = Date.now();
    if (kardexData.length > 0 && lastFetch && now - lastFetch < CACHE_DURATION) {
      return kardexData;
    }
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<KardexProducto[]>(`/kardex/general?storeId=${storeId}`);
      const data = extractApiData(response);
      set({ kardexData: data, filteredData: data, loading: false, lastFetch: now });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar kardex';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  applyFilters: () => {
    const { kardexData, filters } = get();
    let result = kardexData;
    // Filtrar por producto
    if (filters.productId && filters.productId !== 'all') {
      result = result.filter(p => p.producto.id === filters.productId);
    }
    // Filtrar por categoría
    if (filters.category && filters.category !== 'all') {
      result = result.filter(p => p.producto.categorias.includes(filters.category));
    }
    // Filtrar por variante
    if (filters.variantId && filters.variantId !== 'all') {
      result = result.map(p => ({
        ...p,
        variantes: p.variantes.filter(v => v.id === filters.variantId)
      }));
    }
    // Filtrar por tipo de movimiento y fechas
    result = result.map(p => ({
      ...p,
      variantes: p.variantes.map(v => ({
        ...v,
        movimientos: v.movimientos.filter(m => {
          const date = new Date(m.fecha);
          const matchType = filters.movementType === 'all' || m.tipo === filters.movementType;
          const matchFrom = !filters.dateFrom || date >= new Date(filters.dateFrom);
          const matchTo = !filters.dateTo || date <= new Date(filters.dateTo);
          return matchType && matchFrom && matchTo;
        })
      }))
    }));
    set({ filteredData: result });
  },
}));
