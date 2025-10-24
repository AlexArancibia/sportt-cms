import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// Ensure environment variables are properly typed
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_BACKEND_ENDPOINT: string
      NEXT_PUBLIC_API_KEY: string
    }
  }
}

// Create Axios instance with the fixed baseURL from environment variable
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor to include authentication token or API key
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Get token from localStorage if in browser environment
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

    // Set Authorization header with token or API key
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    } else if (process.env.NEXT_PUBLIC_API_KEY) {
      config.headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
    }

    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  },
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
