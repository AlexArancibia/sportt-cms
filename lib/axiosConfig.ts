import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Ensure environment variables are properly typed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_ENDPOINT: string;
      NEXT_PUBLIC_API_KEY: string;
    }
  }
}

// Create an Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to include authentication token or API key
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (process.env.NEXT_PUBLIC_API_KEY) {
      // Use PUBLIC_KEY as a Bearer token if no access token is available
      config.headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`;
    }

    // Ensure the URL is correctly formed
    if (config.url && !config.url.startsWith('https')) {
      config.url = `${process.env.NEXT_PUBLIC_ENDPOINT}${config.url}`;
    }

    return config;
  },
  (error: any) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API request failed:', error);
    // You can add global error handling logic here
    return Promise.reject(error);
  }
);

export default apiClient;

