'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from './product-card'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface KardexGridProps {
  filters: any
}

// Mock data - replace with actual API call
const mockProducts = [
  {
    id: '1',
    title: 'Laptop Dell XPS 15',
    category: 'Electronics',
    variants: [
      {
        id: 'v1',
        sku: 'DELL-XPS-15-512',
        currentStock: 15,
        minStock: 5,
        averageCost: 1250.00,
        totalValue: 18750.00,
        movements: [
          {
            id: 'm1',
            type: 'COMPRA',
            quantity: 20,
            unitCost: 1200.00,
            date: '2024-01-15T10:00:00Z',
            reference: 'PO-001'
          },
          {
            id: 'm2',
            type: 'VENTA',
            quantity: 5,
            unitCost: 1250.00,
            date: '2024-01-20T14:30:00Z',
            reference: 'INV-045'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'iPhone 15 Pro',
    category: 'Electronics',
    variants: [
      {
        id: 'v2',
        sku: 'IPHONE-15-PRO-256',
        currentStock: 3,
        minStock: 10,
        averageCost: 999.00,
        totalValue: 2997.00,
        movements: [
          {
            id: 'm3',
            type: 'COMPRA',
            quantity: 15,
            unitCost: 950.00,
            date: '2024-01-10T09:00:00Z',
            reference: 'PO-002'
          },
          {
            id: 'm4',
            type: 'VENTA',
            quantity: 12,
            unitCost: 999.00,
            date: '2024-01-25T11:00:00Z',
            reference: 'INV-052'
          }
        ]
      }
    ]
  }
]

export function KardexGrid({ filters }: KardexGridProps) {
  const [products, setProducts] = useState(mockProducts)
  const [totalPages, setTotalPages] = useState(5)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate API call
    setLoading(true)
    const timer = setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters])

  const handlePageChange = (newPage: number) => {
    // Handle pagination
    console.log('[v0] Changing to page:', newPage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando productos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          Página {filters.page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
