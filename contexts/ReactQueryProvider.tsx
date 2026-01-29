"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { isNetworkError } from "@/lib/axiosConfig"

type ReactQueryProviderProps = {
  children: ReactNode
}

// Custom retry function: more retries for network errors, fewer for other errors
function retryFunction(failureCount: number, error: any): boolean {
  if (failureCount >= 3) return false
  
  const isNetwork = isNetworkError(error) || error?.isNetworkError
  
  // Network errors: retry up to 3 times
  if (isNetwork) return failureCount < 3
  
  // HTTP errors
  if (error?.response) {
    const status = error.response.status
    // Don't retry 4xx (except 408 timeout)
    if (status >= 400 && status < 500 && status !== 408) return false
    // Retry 5xx and 408 once
    return failureCount < 1
  }
  
  // Default: retry once
  return failureCount < 1
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: retryFunction,
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s, 4s
              return Math.min(1000 * 2 ** attemptIndex, 4000)
            },
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

