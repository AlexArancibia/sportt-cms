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
      // NEXT_PUBLIC_* is embedded in the client JS bundle and is visible to any user. Use only for
      // read-only or public keys; never use for write/admin keys or secrets.
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

// Helper function to detect network errors
export function isNetworkError(error: any): boolean {
  if (!error) return false
  
  // Network error codes
  const networkCodes = [
    'ERR_NETWORK_CHANGED',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK',
    'ERR_CONNECTION_REFUSED',
    'ERR_CONNECTION_RESET',
    'ERR_CONNECTION_TIMED_OUT',
    'ERR_NAME_NOT_RESOLVED',
  ]
  
  // Check error code
  if (error.code && networkCodes.includes(error.code)) return true
  
  // Check error message for network keywords
  if (error.message) {
    const msg = error.message.toLowerCase()
    const networkKeywords = ['network', 'connection', 'timeout', 'failed to fetch', 'networkerror']
    if (networkKeywords.some(keyword => msg.includes(keyword))) return true
  }
  
  // Request made but no response (network issue)
  return !!(error.request && !error.response)
}

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const isNetwork = isNetworkError(error)
    
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        isNetworkError: isNetwork,
      })
    } else if (error.request) {
      // Request was made but no response received (network issue)
      const errorMessage = isNetwork
        ? `Network error: ${error.code || error.message || 'Connection failed'}`
        : "No response received from API"
      console.error(errorMessage, {
        url: error.config?.url,
        code: error.code,
        message: error.message,
      })
      
      // Add a flag to the error so React Query can detect it
      error.isNetworkError = true
    } else {
      // Error setting up the request
      console.error("Error setting up request:", error.message)
    }
    
    return Promise.reject(error)
  },
)

export default apiClient
