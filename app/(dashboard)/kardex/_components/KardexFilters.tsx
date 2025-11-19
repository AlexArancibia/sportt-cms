'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { KardexFilters as KardexFiltersType, MovementType, ValuationMethod } from '@/types/kardex'
import { useMainStore } from '@/stores/mainStore'

interface KardexFiltersProps {
  filters: KardexFiltersType
  onFiltersChange: (filters: KardexFiltersType) => void
  categories: string[]
}

export function KardexFilters({ filters, onFiltersChange, categories }: KardexFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search || '')
  
  const movementTypes: MovementType[] = ['COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE']
  const valuationMethods: ValuationMethod[] = ['WEIGHTED_AVERAGE', 'FIFO']

  // Sincronizar el input cuando cambia el filtro desde fuera (ej: limpiar filtros)
  useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchInput.trim() || undefined, page: 1 })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.category?.includes(category)
      ? filters.category.filter((c: string) => c !== category)
      : [...(filters.category || []), category]
    onFiltersChange({ ...filters, category: newCategories, page: 1 })
  }

  const handleMovementTypeToggle = (type: MovementType) => {
    const newTypes = filters.movementType?.includes(type)
      ? filters.movementType.filter((t: MovementType) => t !== type)
      : [...(filters.movementType || []), type]
    onFiltersChange({ ...filters, movementType: newTypes, page: 1 })
  }

  const clearFilters = () => {
    setSearchInput('')
    onFiltersChange({
      page: 1,
      limit: 20,
    })
  }

  const activeFiltersCount = 
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.category?.length || 0) +
    (filters.movementType?.length || 0) +
    (filters.search ? 1 : 0)

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          
          {/* Quick Category Filter */}
          <Select
            value={filters.category?.[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                category: value === 'all' ? [] : [value],
                page: 1,
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
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, startDate: e.target.value, page: 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, endDate: e.target.value, page: 1 })
                  }
                />
              </div>
            </div>

            {/* Categories - Multi-select */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorías (múltiple selección)</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={filters.category?.includes(category) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                      {filters.category?.includes(category) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Movement Types */}
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <div className="flex flex-wrap gap-2">
                {movementTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.movementType?.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleMovementTypeToggle(type)}
                  >
                    {type}
                    {filters.movementType?.includes(type) && (
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
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, sortBy: value, page: 1 })
                  }
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Fecha de creación</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden</Label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value: 'asc' | 'desc') =>
                    onFiltersChange({ ...filters, sortOrder: value, page: 1 })
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
                  value={filters.valuationMethod || 'WEIGHTED_AVERAGE'}
                  onValueChange={(value: ValuationMethod) =>
                    onFiltersChange({ ...filters, valuationMethod: value, page: 1 })
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

