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
import { X, ChevronDown, ChevronUp, Search, CalendarIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { KardexFilters as KardexFiltersType, MovementType } from '@/types/kardex'
import { useMainStore } from '@/stores/mainStore'

interface KardexFiltersProps {
  filters: KardexFiltersType
  onFiltersChange: (filters: KardexFiltersType) => void
  categories: string[]
  currencies: Array<{ id: string; code: string; name: string; symbol: string }>
}

export function KardexFilters({ filters, onFiltersChange, categories, currencies }: KardexFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search || '')
  
  const movementTypes: MovementType[] = ['COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE']

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

  const handleCurrencyToggle = (currencyId: string) => {
    const newCurrencies = filters.currency?.includes(currencyId)
      ? filters.currency.filter((c: string) => c !== currencyId)
      : [...(filters.currency || []), currencyId]
    onFiltersChange({ ...filters, currency: newCurrencies, page: 1 })
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
    (filters.currency?.length || 0) +
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
          
          {/* Quick Currency Filter */}
          <Select
            value={filters.currency?.[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                currency: value === 'all' ? [] : [value],
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las monedas</SelectItem>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code.toUpperCase()} - {currency.name}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !filters.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(parseISO(filters.startDate), "dd/MM/yyyy", { locale: es })
                      ) : (
                        <span>dd/mm/aaaa</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate ? parseISO(filters.startDate) : undefined}
                      onSelect={(date) =>
                        onFiltersChange({
                          ...filters,
                          startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
                          page: 1,
                        })
                      }
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !filters.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(parseISO(filters.endDate), "dd/MM/yyyy", { locale: es })
                      ) : (
                        <span>dd/mm/aaaa</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate ? parseISO(filters.endDate) : undefined}
                      onSelect={(date) =>
                        onFiltersChange({
                          ...filters,
                          endDate: date ? format(date, 'yyyy-MM-dd') : undefined,
                          page: 1,
                        })
                      }
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Currencies - Multi-select */}
            {currencies.length > 0 && (
              <div className="space-y-2">
                <Label>Monedas (múltiple selección)</Label>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((currency) => (
                    <Badge
                      key={currency.id}
                      variant={filters.currency?.includes(currency.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleCurrencyToggle(currency.id)}
                    >
                      {currency.code.toUpperCase()} - {currency.name}
                      {filters.currency?.includes(currency.id) && (
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

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

