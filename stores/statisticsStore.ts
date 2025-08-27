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
      // Si el endpoint normal falla, intentar con localhost:8888
      try {
        const localResponse = await fetch(`http://localhost:8888/statistics?storeId=${storeId}`, {
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}`,
            'Content-Type': 'application/json',
          },
        });
        if (!localResponse.ok) throw new Error('Localhost response not ok');
        const localData = await localResponse.json();
        set({ data: localData, loading: false, lastFetch: now });
        return localData;
      } catch (localErr: any) {
        set({ error: error?.response?.data?.message || error.message || 'Error al cargar estadísticas', loading: false });
        throw error;
      }
    }
  },
}));
