'use client'

import { Card } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Badge } from './ui/badge'
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useState } from 'react'

interface KardexFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
}

export function KardexFilters({ filters, onFiltersChange }: KardexFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const categories = ['Electronics', 'Clothing', 'Food', 'Toys', 'Books']
  const movementTypes = ['COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE']

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter((c: string) => c !== category)
      : [...filters.category, category]
    onFiltersChange({ ...filters, category: newCategories })
  }

  const handleMovementTypeToggle = (type: string) => {
    const newTypes = filters.movementType.includes(type)
      ? filters.movementType.filter((t: string) => t !== type)
      : [...filters.movementType, type]
    onFiltersChange({ ...filters, movementType: newTypes })
  }

  const clearFilters = () => {
    onFiltersChange({
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
  }

  const activeFiltersCount = 
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    filters.category.length +
    filters.movementType.length

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Simple Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o código..."
              className="pl-10"
              value={filters.search || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
            />
          </div>
          
          {/* Quick Category Filter */}
          <Select
            value={filters.category[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                category: value === 'all' ? [] : [value],
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            Filtros avanzados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            {showAdvancedFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Categories - Multi-select */}
            <div className="space-y-2">
              <Label>Categorías (múltiple selección)</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={filters.category.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                    {filters.category.includes(category) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Movement Types */}
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <div className="flex flex-wrap gap-2">
                {movementTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.movementType.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleMovementTypeToggle(type)}
                  >
                    {type}
                    {filters.movementType.includes(type) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sorting and Valuation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortBy">Ordenar por</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, sortBy: value })
                  }
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Fecha de creación</SelectItem>
                    <SelectItem value="title">Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, sortOrder: value })
                  }
                >
                  <SelectTrigger id="sortOrder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationMethod">Método de Valuación</Label>
                <Select
                  value={filters.valuationMethod}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, valuationMethod: value })
                  }
                >
                  <SelectTrigger id="valuationMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHTED_AVERAGE">Promedio Ponderado</SelectItem>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
