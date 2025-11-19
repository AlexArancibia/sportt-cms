'use client'

import { useState } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AlertTriangle } from 'lucide-react'
import { MovementsTable } from './movements-table'
import { StockChart } from './stock-chart'
// import { PriceChart } from './price-chart'

interface VariantDetailsProps {
  variant: any
}

export function VariantDetails({ variant }: VariantDetailsProps) {
  const isLowStock = variant.currentStock < variant.minStock

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Variant Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-mono text-muted-foreground">SKU: {variant.sku}</p>
              {isLowStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stock Bajo
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Stock Actual</p>
                <p className={`text-lg font-semibold mt-1 ${isLowStock ? 'text-destructive' : ''}`}>
                  {variant.currentStock}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Mínimo</p>
                <p className="text-lg font-semibold mt-1">{variant.minStock}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Costo Promedio</p>
                <p className="text-lg font-semibold mt-1">
                  ${variant.averageCost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold mt-1">
                  ${variant.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="stock-chart">Gráfica de Stock</TabsTrigger>
          </TabsList>
          
          <TabsContent value="movements" className="mt-4">
            <MovementsTable movements={variant.movements} />
          </TabsContent>
          
          <TabsContent value="stock-chart" className="mt-4">
            <StockChart movements={variant.movements} />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
