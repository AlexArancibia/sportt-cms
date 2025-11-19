'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp } from 'lucide-react'
import { VariantDetails } from './VariantDetails'
import type { KardexProduct } from '@/types/kardex'

interface ProductCardProps {
  product: KardexProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate total stock across variants
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.summary.finalStock,
    0
  )

  // Check if any variant has low stock
  const hasLowStock = product.variants.some(
    (v) => v.summary.finalStock <= 0
  )

  // Calculate total value
  const totalValue = product.variants.reduce(
    (sum, v) => sum + v.summary.totalValue,
    0
  )

  // Calculate total movements
  const totalMovements = product.variants.reduce(
    (sum, v) => sum + v.movements.length,
    0
  )

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
                  ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4 space-y-4">
            {product.variants.map((variant) => (
              <VariantDetails key={variant.id} variant={variant} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

