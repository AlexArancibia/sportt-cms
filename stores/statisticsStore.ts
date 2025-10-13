import { create } from 'zustand';
import apiClient from '@/lib/axiosConfig';
import { extractApiData } from '@/lib/apiHelpers';

interface StatisticsData {
  [key: string]: unknown;
}

interface StatisticsState {
  data: StatisticsData | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  fetchStatistics: (storeId: string) => Promise<StatisticsData>;
  setData: (data: StatisticsData) => void;
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
      const response = await apiClient.get<StatisticsData>(`/statistics?storeId=${storeId}`);
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
