import { create } from 'zustand';

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
  setKardexData: (data: KardexProducto[]) => void;
  setFilters: (filters: Partial<KardexFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
}

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
  setKardexData: (data) => set({ kardexData: data, filteredData: data }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () => set({ filters: initialFilters, filteredData: get().kardexData }),
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
