import { create } from 'zustand';
import apiClient from '@/lib/axiosConfig';

interface StatisticsState {
  data: any;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  fetchStatistics: (storeId: string) => Promise<any>;
  setData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  lastFetch: null,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  fetchStatistics: async (storeId: string) => {
    const { lastFetch, data } = get();
    const now = Date.now();
    if (data && lastFetch && now - lastFetch < CACHE_DURATION) {
      return data;
    }
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/statistics?storeId=${storeId}`);
      set({ data: response.data, loading: false, lastFetch: now });
      return response.data;
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message || 'Error al cargar estadísticas', loading: false });
      throw error;
    }
  },
}));
