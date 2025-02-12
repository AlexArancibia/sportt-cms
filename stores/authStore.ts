import { create } from 'zustand';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import apiClient from '../lib/axiosConfig';

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

interface LoginResponse {
  access_token: string;
  userInfo: UserInfo;
}

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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

    if (token && userString) {
      try {
        const decoded: ExtendedJwtPayload = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp > currentTime) {
          const user: UserInfo = JSON.parse(userString);
          set({ user, isAuthenticated: true, loading: false });
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          set({ user: null, isAuthenticated: false, loading: false });
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, loading: false });
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

      const { access_token, userInfo } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userInfo));

      set({
        user: userInfo,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error durante el login:', error);
      set({
        loading: false,
        error: error.response?.data?.message || 'Error desconocido durante el login',
      });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },
}));

