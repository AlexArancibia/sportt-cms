'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { MovementsTable } from './MovementsTable'
import { StockChart } from './StockChart'
import { getCurrencyValue, isCalculatedOnTheFly } from './kardexHelpers'
import { validateKardexVariant } from './kardexValidation'
import { KardexValidationAlert, ValidationBadge } from './KardexValidationAlert'
import type { KardexVariant } from '@/types/kardex'

interface VariantDetailsProps {
  variant: KardexVariant
  selectedCurrencyId?: string | null
  hasMovementTypeFilter?: boolean
  hasDateFilter?: boolean
  hasCurrencyFilter?: boolean
}

export function VariantDetails({ variant, selectedCurrencyId, hasMovementTypeFilter = false, hasDateFilter = false, hasCurrencyFilter = false }: VariantDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  const [showValidation, setShowValidation] = useState(true)
  
  const hasLowStock = variant.summary.finalStock <= 0

  // Usar periodInitialStock si existe (cuando hay filtro de fecha), sino usar initialStock
  const effectiveInitialStock = variant.summary.periodInitialStock ?? variant.summary.initialStock

  // Validar integridad del kardex
  // Desactivar validación si hay filtro de tipo de movimiento o filtro de currency activo
  // Con filtro de fecha, la validación funciona correctamente usando periodInitialStock
  const validation = useMemo(() => {
    if (hasMovementTypeFilter || hasCurrencyFilter) {
      // Retornar validación vacía cuando el filtro de tipo o currency está activo
      return {
        isValid: true,
        issues: [],
        warnings: [],
      }
    }
    return validateKardexVariant(variant)
  }, [variant, hasMovementTypeFilter, hasCurrencyFilter])

  // Verificar si los valores se calculan sobre la marcha
  const isOnTheFly = isCalculatedOnTheFly(variant.summary)

  // Calcular Venta Total: suma VENTA, resta DEVOLUCION, convertido a la moneda seleccionada
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

      // Si hay moneda seleccionada, usar el valor convertido a esa moneda
      // Si no, usar la moneda original (exchangeRate === 1.0)
      const currencyValue = selectedCurrencyId
        ? movement.values.find(v => v.currency.id === selectedCurrencyId)
        : movement.values.find(v => v.exchangeRate === 1.0)

      // Si no se encuentra, usar el primer valor disponible
      const finalValue = currencyValue || movement.values[0]

      if (!finalValue) {
        return total
      }

      // Sumar para VENTA, restar para DEVOLUCION
      return movement.type === 'VENTA'
        ? total + finalValue.totalCost
        : total - finalValue.totalCost
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
        {/* Validación de integridad */}
        {/* Ocultar validación si hay filtro de tipo de movimiento o filtro de currency activo */}
        {!(hasMovementTypeFilter || hasCurrencyFilter) && showValidation && !validation.isValid && (
          <KardexValidationAlert 
            validation={validation} 
            variantId={variant.id}
            onDismiss={() => setShowValidation(false)}
          />
        )}

        {/* Advertencia de cálculo sobre la marcha */}
        {isOnTheFly && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Los valores se están calculando sobre la marcha. Para guardarlos en la base de datos, use el endpoint de corrección.
            </p>
          </div>
        )}

        {/* Variant Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-sm font-mono text-muted-foreground">
                {variant.sku ? `SKU: ${variant.sku}` : `Variante: ${variant.name}`}
              </p>
              {hasLowStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Sin Stock
                </Badge>
              )}
              {!(hasMovementTypeFilter || hasCurrencyFilter) && <ValidationBadge validation={validation} />}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {variant.summary.periodInitialStock !== undefined 
                    ? 'Stock Inicial del Período' 
                    : 'Stock Inicial'}
                </p>
                <p className="text-lg font-semibold mt-1 text-foreground">{effectiveInitialStock}</p>
                {variant.summary.periodInitialStock !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Original: {variant.summary.initialStock}
                  </p>
                )}
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
                initialStock={effectiveInitialStock}
                selectedCurrencyId={selectedCurrencyId} 
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  )
}

