'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { MovementsTable } from './MovementsTable'
import { StockChart } from './StockChart'
import type { KardexVariant } from '@/types/kardex'

interface VariantDetailsProps {
  variant: KardexVariant
}

export function VariantDetails({ variant }: VariantDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  
  const hasLowStock = variant.summary.finalStock <= 0

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Variant Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-mono text-muted-foreground">
                {variant.sku ? `SKU: ${variant.sku}` : `Variante: ${variant.name}`}
              </p>
              {hasLowStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Sin Stock
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Stock Inicial</p>
                <p className="text-lg font-semibold mt-1 text-foreground">{variant.summary.initialStock}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Final</p>
                <p className={`text-lg font-semibold mt-1 ${hasLowStock ? 'text-destructive' : 'text-foreground'}`}>
                  {variant.summary.finalStock}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Costo Promedio</p>
                <p className="text-lg font-semibold mt-1 text-foreground">
                  ${variant.summary.avgUnitCost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold mt-1 text-foreground">
                  ${variant.summary.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Entradas</p>
                <p className="text-sm font-medium mt-1 text-green-600">+{variant.summary.totalIn}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Salidas</p>
                <p className="text-sm font-medium mt-1 text-red-600">-{variant.summary.totalOut}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Movimientos</p>
                <p className="text-sm font-medium mt-1 text-foreground">{variant.movements.length}</p>
              </div>
            </div>
          </div>

          {variant.movements.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="ml-4"
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Tabs for different views */}
        {expanded && variant.movements.length > 0 && (
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
        )}
      </div>
    </Card>
  )
}

