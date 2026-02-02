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

const MOVEMENT_TYPES: MovementType[] = ['COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE']

function toggleInArray<T>(current: T[] | undefined, item: T): T[] {
  const arr = current ?? []
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function MultiSelectBadges<T>({
  items,
  selectedValues,
  onToggle,
  getValue,
  getLabel,
}: {
  items: T[]
  selectedValues: string[]
  onToggle: (value: string) => void
  getValue: (item: T) => string
  getLabel: (item: T) => string
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const value = getValue(item)
        const isSelected = selectedValues.includes(value)
        return (
          <Badge
            key={value}
            variant={isSelected ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onToggle(value)}
          >
            {getLabel(item)}
            {isSelected && <X className="ml-1 h-3 w-3" />}
          </Badge>
        )
      })}
    </div>
  )
}

interface KardexFiltersProps {
  filters: KardexFiltersType
  onFiltersChange: (filters: KardexFiltersType) => void
  categories: string[]
  currencies: Array<{ id: string; code: string; name: string; symbol: string }>
}

export function KardexFilters({ filters, onFiltersChange, categories, currencies }: KardexFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  useEffect(() => {
    setSearchInput(filters.search ?? '')
  }, [filters.search])

  const updateFilter = (updates: Partial<KardexFiltersType>) => {
    onFiltersChange({ ...filters, ...updates, page: 1 })
  }

  const handleSearch = () => updateFilter({ search: searchInput.trim() || undefined })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleCategoryToggle = (category: string) => {
    updateFilter({ category: toggleInArray(filters.category, category) })
  }

  const handleCurrencyToggle = (currencyId: string) => {
    updateFilter({ currency: toggleInArray(filters.currency, currencyId) })
  }

  const handleMovementTypeToggle = (type: MovementType) => {
    updateFilter({ movementType: toggleInArray(filters.movementType, type) })
  }

  const clearFilters = () => {
    setSearchInput('')
    onFiltersChange({ page: 1, limit: 20 })
  }

  const activeFiltersCount =
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.category?.length ?? 0) +
    (filters.movementType?.length ?? 0) +
    (filters.currency?.length ?? 0) +
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
            onValueChange={(value) => updateFilter({ currency: value === 'all' ? [] : [value] })}
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
                      onSelect={(date) => updateFilter({ startDate: date ? format(date, 'yyyy-MM-dd') : undefined })}
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
                      onSelect={(date) => updateFilter({ endDate: date ? format(date, 'yyyy-MM-dd') : undefined })}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorías (múltiple selección)</Label>
                <MultiSelectBadges
                  items={categories}
                  selectedValues={filters.category ?? []}
                  onToggle={handleCategoryToggle}
                  getValue={(c) => c}
                  getLabel={(c) => c}
                />
              </div>
            )}

            {currencies.length > 0 && (
              <div className="space-y-2">
                <Label>Monedas (múltiple selección)</Label>
                <MultiSelectBadges
                  items={currencies}
                  selectedValues={filters.currency ?? []}
                  onToggle={handleCurrencyToggle}
                  getValue={(c) => c.id}
                  getLabel={(c) => `${c.code.toUpperCase()} - ${c.name}`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <MultiSelectBadges
                items={MOVEMENT_TYPES}
                selectedValues={filters.movementType ?? []}
                onToggle={(v) => handleMovementTypeToggle(v as MovementType)}
                getValue={(t) => t}
                getLabel={(t) => t}
              />
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortBy">Ordenar por</Label>
                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) => updateFilter({ sortBy: value })}
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
                  onValueChange={(value: 'asc' | 'desc') => updateFilter({ sortOrder: value })}
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

