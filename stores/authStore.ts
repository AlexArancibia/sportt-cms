import { create } from 'zustand';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import apiClient from '../lib/axiosConfig';
import { extractApiData } from '../lib/apiHelpers';

interface ExtendedJwtPayload extends JwtPayload {
  exp?: number;
}

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  access_token: string;
  userInfo: UserInfo;
  stores: Store[];
}

interface AuthState {
  user: UserInfo | null;
  stores: Store[];
  currentStoreId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  setCurrentStore: (storeId: string) => void;
  getCurrentStore: () => Store | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  stores: [],
  currentStoreId: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  initializeAuth: async () => {
    if (typeof window === 'undefined') {
      set({ loading: false });
      return;
    }

    const token = localStorage.getItem('access_token');
    const userString = localStorage.getItem('user');
    const storesString = localStorage.getItem('stores');
    const currentStoreId = localStorage.getItem('currentStoreId');

    if (token && userString) {
      try {
        const decoded: ExtendedJwtPayload = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp > currentTime) {
          const user: UserInfo = JSON.parse(userString);
          const stores: Store[] = storesString ? JSON.parse(storesString) : [];
          
          set({ 
            user, 
            stores,
            currentStoreId,
            isAuthenticated: true, 
            loading: false 
          });
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('stores');
          localStorage.removeItem('currentStoreId');
          set({ user: null, stores: [], currentStoreId: null, isAuthenticated: false, loading: false });
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('stores');
        localStorage.removeItem('currentStoreId');
        set({ user: null, stores: [], currentStoreId: null, isAuthenticated: false, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // Extraer datos usando el helper (maneja estructura encapsulada del backend)
      const { access_token, userInfo, stores } = extractApiData(response);

      // Guardar en localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('stores', JSON.stringify(stores || []));
      
      // Si hay stores, seleccionar el primero por defecto
      const defaultStoreId = stores && stores.length > 0 ? stores[0].id : null;
      if (defaultStoreId) {
        localStorage.setItem('currentStoreId', defaultStoreId);
      }

      set({
        user: userInfo,
        stores: stores || [],
        currentStoreId: defaultStoreId,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido durante el login';
      
      console.error('Error durante el login:', error);
      set({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
    
    set({
      user: null,
      stores: [],
      currentStoreId: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  setCurrentStore: (storeId: string) => {
    localStorage.setItem('currentStoreId', storeId);
    set({ currentStoreId: storeId });
  },

  getCurrentStore: () => {
    const { stores, currentStoreId } = get();
    if (!currentStoreId || !stores.length) return null;
    return stores.find((s) => s.id === currentStoreId) || null;
  },
}));

