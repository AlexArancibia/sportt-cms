import { QueryClient } from "@tanstack/react-query"
import { isNetworkError } from "@/lib/axiosConfig"

function retryFunction(failureCount: number, error: any): boolean {
  if (failureCount >= 3) return false
  const isNetwork = isNetworkError(error) || error?.isNetworkError
  if (isNetwork) return failureCount < 3
  if (error?.response) {
    const status = error.response.status
    if (status >= 400 && status < 500 && status !== 408) return false
    return failureCount < 1
  }
  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: retryFunction,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
})
