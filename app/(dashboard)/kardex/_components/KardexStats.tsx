'use client'

import { Card } from '@/components/ui/card'
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { useKardexStats } from '@/hooks/kardex/useKardexStats'
import type { KardexFilters } from '@/types/kardex'

interface KardexStatsProps {
  filters: KardexFilters
  storeId: string | null
  selectedCurrencyId?: string | null
}

const defaultStats = {
  totalProducts: 0,
  totalValuesByCurrency: [],
  lowStock: 0,
  movements: 0,
}

export function KardexStats({ filters, storeId, selectedCurrencyId }: KardexStatsProps) {
  const { data: stats = defaultStats, isLoading: loading } = useKardexStats(
    storeId,
    filters,
    !!storeId
  )

  // Obtener el valor total de la moneda seleccionada
  const { totalValue, currencySymbol } = useMemo(() => {
    if (!stats.totalValuesByCurrency?.length) {
      return { totalValue: 0, currencySymbol: '$' }
    }

    const currencyValue = selectedCurrencyId
      ? stats.totalValuesByCurrency.find(v => v.currency.id === selectedCurrencyId)
      : stats.totalValuesByCurrency[0]

    return {
      totalValue: currencyValue?.totalValue ?? 0,
      currencySymbol: currencyValue?.currency.symbol ?? '$'
    }
  }, [stats.totalValuesByCurrency, selectedCurrencyId])

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
              {currencySymbol}{totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

