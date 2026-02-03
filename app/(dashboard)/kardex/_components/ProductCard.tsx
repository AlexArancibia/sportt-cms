'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { VariantDetails } from './VariantDetails'
import { getCurrencyValue, getCurrencySymbol, isCalculatedOnTheFly } from './kardexHelpers'
import { validateKardexVariant } from './kardexValidation'
import type { KardexProduct } from '@/types/kardex'

interface ProductCardProps {
  product: KardexProduct
  selectedCurrencyId?: string | null
  hasMovementTypeFilter?: boolean
  hasDateFilter?: boolean
  hasCurrencyFilter?: boolean
}

export function ProductCard({ product, selectedCurrencyId, hasMovementTypeFilter = false, hasDateFilter = false, hasCurrencyFilter = false }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Memoized calculations
  const { totalStock, totalValue, currencySymbol, totalMovements, hasLowStock, hasValidationIssues, hasOnTheFlyCalculations } = useMemo(() => {
    const stock = product.variants.reduce((sum, v) => sum + v.summary.finalStock, 0)
    const movements = product.variants.reduce((sum, v) => sum + v.movements.length, 0)
    const lowStock = product.variants.some(v => v.summary.finalStock <= 0)

    // Validar todas las variantes (solo si no hay filtro de tipo de movimiento ni filtro de currency)
    const validations = (hasMovementTypeFilter || hasCurrencyFilter)
      ? [] 
      : product.variants.map(v => validateKardexVariant(v))
    const hasIssues = !(hasMovementTypeFilter || hasCurrencyFilter) && validations.some(v => !v.isValid || v.warnings.length > 0)
    const hasOnTheFly = product.variants.some(v => isCalculatedOnTheFly(v.summary))

    // Calculate total value and get currency symbol
    let value = 0
    let symbol = '$'
    const firstVariantWithValues = product.variants.find(
      v => v.summary.totalValuesByCurrency?.length
    )

    if (firstVariantWithValues) {
      const allValues = firstVariantWithValues.summary.totalValuesByCurrency
      symbol = getCurrencySymbol(allValues, selectedCurrencyId)

      value = product.variants.reduce((sum, variant) => {
        const currencyValue = getCurrencyValue(variant.summary, selectedCurrencyId)
        return sum + (currencyValue?.totalValue ?? 0)
      }, 0)
    }

    return { 
      totalStock: stock, 
      totalValue: value, 
      currencySymbol: symbol, 
      totalMovements: movements, 
      hasLowStock: lowStock,
      hasValidationIssues: hasIssues,
      hasOnTheFlyCalculations: hasOnTheFly,
    }
  }, [product.variants, selectedCurrencyId, hasMovementTypeFilter, hasCurrencyFilter])

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{product.product.name}</h3>
              {product.product.categories.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {product.product.categories.map((category) => (
                    <Badge key={category} variant="outline" className="text-foreground">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
              {hasLowStock && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stock Bajo
                </Badge>
              )}
              {hasValidationIssues && (
                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
                  <AlertTriangle className="h-3 w-3" />
                  Problemas Detectados
                </Badge>
              )}
              {hasOnTheFlyCalculations && (
                <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700">
                  <AlertTriangle className="h-3 w-3" />
                  Valores Calculados
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Variantes</p>
                <p className="text-sm font-medium mt-1 text-foreground">{product.variants.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Total</p>
                <p className="text-sm font-medium mt-1 text-foreground">{totalStock} unidades</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-sm font-medium mt-1 text-foreground">
                  {currencySymbol}{totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Movimientos</p>
                <p className="text-sm font-medium mt-1 text-foreground">{totalMovements}</p>
              </div>
            </div>
          </div>

          {product.variants.length > 0 && (
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
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4 space-y-4">
            {product.variants.map((variant) => (
              <VariantDetails 
                key={variant.id} 
                variant={variant} 
                selectedCurrencyId={selectedCurrencyId}
                hasMovementTypeFilter={hasMovementTypeFilter}
                hasDateFilter={hasDateFilter}
                hasCurrencyFilter={hasCurrencyFilter}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

