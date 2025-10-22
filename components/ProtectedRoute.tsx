'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, initializeAuth } = useAuthStore()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && pathname !== '/login') {
        setIsTransitioning(true);
        router.push('/login');
        setTimeout(() => setIsTransitioning(false), 500);
      } else if (isAuthenticated && pathname === '/login') {
        setIsTransitioning(true);
        router.push('/');
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading || isTransitioning) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

