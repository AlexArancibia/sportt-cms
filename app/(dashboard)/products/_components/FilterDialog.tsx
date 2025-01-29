import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useMainStore } from "@/stores/mainStore"
export interface FilterOptions {
  categories: string[]
  collections: string[]
  minPrice: number
  maxPrice: number
  sortBy: string
}



interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilters: (filters: FilterOptions) => void
  initialFilters: FilterOptions
}

export function FilterDialog({ open, onOpenChange, onApplyFilters, initialFilters }: FilterDialogProps) {
  const { categories, collections, products } = useMainStore()
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, categoryId] : prev.categories.filter((id) => id !== categoryId),
    }))
  }

  const handleCollectionChange = (collectionId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      collections: checked ? [...prev.collections, collectionId] : prev.collections.filter((id) => id !== collectionId),
    }))
  }

  const handlePriceChange = (value: number[]) => {
    setFilters((prev) => ({ ...prev, minPrice: value[0], maxPrice: value[1] }))
  }

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sortBy: value }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onOpenChange(false)
  }

  const maxPrice = Math.max(...products.flatMap((p) => p.prices.map((price) => price.price)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Productos</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Categorías</Label>
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.categories.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Colecciones</Label>
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`collection-${collection.id}`}
                  checked={filters.collections.includes(collection.id)}
                  onCheckedChange={(checked) => handleCollectionChange(collection.id, checked as boolean)}
                />
                <Label htmlFor={`collection-${collection.id}`}>{collection.title}</Label>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Rango de Precio</Label>
            <Slider
              min={0}
              max={maxPrice}
              step={1}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={handlePriceChange}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>${filters.minPrice}</span>
              <span>${filters.maxPrice}</span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Ordenar por</Label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="price_asc">Precio (Menor a Mayor)</SelectItem>
                <SelectItem value="price_desc">Precio (Mayor a Menor)</SelectItem>
                <SelectItem value="created_at_desc">Más recientes</SelectItem>
                <SelectItem value="created_at_asc">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

