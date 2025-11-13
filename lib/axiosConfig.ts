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

    const headers = (config.headers ?? {}) as Record<string, any>
    const existingAuth =
      headers.Authorization ||
      headers.authorization ||
      (typeof headers.get === "function" ? headers.get("Authorization") : undefined)

    if (!existingAuth) {
      const value = token
        ? `Bearer ${token}`
        : process.env.NEXT_PUBLIC_API_KEY
          ? `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
          : null

      if (value) {
        if (typeof headers.set === "function") {
          headers.set("Authorization", value)
        } else {
          headers.Authorization = value
        }
      }
    }

    config.headers = headers as any

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
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      })
    } else if (error.request) {
      console.error("No response received from API")
    } else {
      console.error("Error setting up request:", error.message)
    }
    return Promise.reject(error)
  },
)

export default apiClient
