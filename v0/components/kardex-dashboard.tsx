'use client'

import { useState } from 'react'
import { KardexFilters } from './kardex-filters'
import { KardexGrid } from './kardex-grid'
import { KardexStats } from './kardex-stats'
import { Button } from './ui/button'
import { Download, FileSpreadsheet } from 'lucide-react'

export function KardexDashboard() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: [],
    movementType: [],
    valuationMethod: 'WEIGHTED_AVERAGE',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })

  const handleExport = () => {
    // Implement export logic
    console.log('[v0] Exporting kardex data with filters:', filters)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Sistema de Kardex</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Control y gestión de inventario
              </p>
            </div>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <KardexStats filters={filters} />

        {/* Filters */}
        <KardexFilters filters={filters} onFiltersChange={setFilters} />

        {/* Product Grid */}
        <KardexGrid filters={filters} />
      </div>
    </div>
  )
}
