'use client'

import { useState } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { VariantDetails } from './variant-details'

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate total stock across variants
  const totalStock = product.variants.reduce(
    (sum: number, v: any) => sum + v.currentStock,
    0
  )

  // Check if any variant has low stock
  const hasLowStock = product.variants.some(
    (v: any) => v.currentStock < v.minStock
  )

  // Calculate total value
  const totalValue = product.variants.reduce(
    (sum: number, v: any) => sum + v.totalValue,
    0
  )

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <Badge variant="secondary">{product.category}</Badge>
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
                <p className="text-sm font-medium mt-1">{product.variants.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Total</p>
                <p className="text-sm font-medium mt-1">{totalStock} unidades</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-sm font-medium mt-1">
                  ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <div className="flex items-center gap-1 mt-1">
                  {hasLowStock ? (
                    <span className="text-sm font-medium text-destructive">Crítico</span>
                  ) : (
                    <span className="text-sm font-medium text-success">Normal</span>
                  )}
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4 space-y-4">
            {product.variants.map((variant: any) => (
              <VariantDetails key={variant.id} variant={variant} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
