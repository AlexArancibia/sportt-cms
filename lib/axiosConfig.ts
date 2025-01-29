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
    console.log('Request interceptor called with config:', config);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    console.log('Access token retrieved:', token);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set with access token');
    } else if (process.env.NEXT_PUBLIC_API_KEY) {
      config.headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`;
      console.log('Authorization header set with API key');
    }

    // Ensure the URL is correctly formed
    if (config.url && !config.url.startsWith('https')) {
      console.log('URL before correction:', config.url);
      config.url = `${process.env.NEXT_PUBLIC_ENDPOINT}${config.url}`;
      console.log('URL after correction:', config.url);
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
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('API request failed:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    } else {
      console.error('Unexpected error during API request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
