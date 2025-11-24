'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { MovementsTable } from './MovementsTable'
import { StockChart } from './StockChart'
import { getCurrencyValue } from './kardexHelpers'
import type { KardexVariant } from '@/types/kardex'

interface VariantDetailsProps {
  variant: KardexVariant
  selectedCurrencyId?: string | null
}

export function VariantDetails({ variant, selectedCurrencyId }: VariantDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  
  const hasLowStock = variant.summary.finalStock <= 0

  // Calcular Venta Total: suma VENTA, resta DEVOLUCION, filtrado por moneda seleccionada
  const totalSales = useMemo(() => {
    return variant.movements.reduce((total, movement) => {
      // Solo procesar VENTA y DEVOLUCION (AJUSTE no tiene values[])
      if (movement.type !== 'VENTA' && movement.type !== 'DEVOLUCION') {
        return total
      }

      // Si no hay values[] o está vacío, usar totalCost como fallback
      if (!movement.values || movement.values.length === 0) {
        if (movement.type === 'VENTA') {
          return total + movement.totalCost
        } else {
          return total - movement.totalCost
        }
      }

      // Buscar el valor en la moneda seleccionada
      const currencyValue = selectedCurrencyId
        ? movement.values.find(v => v.currency.id === selectedCurrencyId)
        : movement.values.find(v => v.exchangeRate === 1.0) // Moneda original

      if (!currencyValue) {
        // Si no se encuentra, usar el primer valor disponible
        const firstValue = movement.values[0]
        if (firstValue) {
          return movement.type === 'VENTA'
            ? total + firstValue.totalCost
            : total - firstValue.totalCost
        }
        return total
      }

      // Sumar para VENTA, restar para DEVOLUCION
      return movement.type === 'VENTA'
        ? total + currencyValue.totalCost
        : total - currencyValue.totalCost
    }, 0)
  }, [variant.movements, selectedCurrencyId])

  // Obtener símbolo de moneda para mostrar
  const currencySymbol = useMemo(() => {
    const currencyValue = getCurrencyValue(variant.summary, selectedCurrencyId)
    return currencyValue?.currency.symbol || '$'
  }, [variant.summary, selectedCurrencyId])

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
                <p className="text-xs text-muted-foreground">Venta Total</p>
                <p className="text-lg font-semibold mt-1 text-foreground">
                  {currencySymbol}{totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold mt-1 text-foreground">
                  {(() => {
                    const currencyValue = getCurrencyValue(variant.summary, selectedCurrencyId)
                    if (!currencyValue) {
                      return '$0.00'
                    }
                    return `${currencyValue.currency.symbol}${currencyValue.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                  })()}
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
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="ml-4 border-2 hover:bg-accent hover:border-primary transition-colors"
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
              <StockChart 
                movements={variant.movements} 
                initialStock={variant.summary.initialStock}
                selectedCurrencyId={selectedCurrencyId} 
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  )
}

