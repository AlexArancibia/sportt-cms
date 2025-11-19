'use client'

import { Card } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/axiosConfig'
import { extractApiData } from '@/lib/apiHelpers'
import type { KardexFilters } from '@/types/kardex'

interface KardexStatsProps {
  filters: KardexFilters
  storeId: string | null
}

interface KardexStatsData {
  totalProducts: number
  totalValue: number
  lowStock: number
  movements: number
}

export function KardexStats({ filters, storeId }: KardexStatsProps) {
  const [stats, setStats] = useState<KardexStatsData>({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    movements: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!storeId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        if (filters.search) params.append('query', filters.search)
        if (filters.valuationMethod) params.append('valuationMethod', filters.valuationMethod)
        if (filters.category && filters.category.length > 0) {
          filters.category.forEach(cat => params.append('category', cat))
        }
        if (filters.movementType && filters.movementType.length > 0) {
          filters.movementType.forEach(type => params.append('movementType', type))
        }

        const queryString = params.toString()
        const url = `/kardex/${storeId}/stats${queryString ? `?${queryString}` : ''}`
        
        const response = await apiClient.get<KardexStatsData>(url)
        const statsData = extractApiData(response)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching kardex stats:', error)
        // En caso de error, mantener valores en 0
        setStats({
          totalProducts: 0,
          totalValue: 0,
          lowStock: 0,
          movements: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [
    storeId, 
    filters.startDate, 
    filters.endDate, 
    filters.search, 
    filters.valuationMethod, 
    filters.category?.join(','), 
    filters.movementType?.join(',')
  ])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Productos</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">{stats.totalProducts}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">
              ${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Movimientos</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">{stats.movements}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Stock Bajo</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">{stats.lowStock}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </Card>
    </div>
  )
}

