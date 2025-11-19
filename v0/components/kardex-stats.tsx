'use client'

import { Card } from './ui/card'
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface KardexStatsProps {
  filters: any
}

export function KardexStats({ filters }: KardexStatsProps) {
  // Mock data - replace with actual API call
  const stats = {
    totalProducts: 24,
    totalValue: 145234.50,
    lowStock: 3,
    movements: 156,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Productos</p>
            <p className="text-2xl font-semibold mt-1">{stats.totalProducts}</p>
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
            <p className="text-2xl font-semibold mt-1">
              ${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-success" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Movimientos</p>
            <p className="text-2xl font-semibold mt-1">{stats.movements}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-chart-2" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Stock Bajo</p>
            <p className="text-2xl font-semibold mt-1">{stats.lowStock}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
        </div>
      </Card>
    </div>
  )
}
