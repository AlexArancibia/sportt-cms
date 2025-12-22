"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PDFFilterConfig } from "@/types/pdf-export"
import { ProductStatus } from "@/types/common"
import { Category } from "@/types/category"
import { Collection } from "@/types/collection"

interface FilterTabProps {
  filterConfig: PDFFilterConfig
  onFilterChange: (config: PDFFilterConfig) => void
  categories: Category[]
  collections: Collection[]
  vendors: string[]
}

export function FilterTab({
  filterConfig,
  onFilterChange,
  categories,
  collections,
  vendors,
}: FilterTabProps) {
  const updateFilter = (key: keyof PDFFilterConfig, value: any) => {
    onFilterChange({ ...filterConfig, [key]: value })
  }

  const toggleCategory = (categoryId: string) => {
    const current = filterConfig.categoryIds || []
    const updated = current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId]
    updateFilter('categoryIds', updated)
  }

  const toggleCollection = (collectionId: string) => {
    const current = filterConfig.collectionIds || []
    const updated = current.includes(collectionId)
      ? current.filter(id => id !== collectionId)
      : [...current, collectionId]
    updateFilter('collectionIds', updated)
  }

  const toggleStatus = (status: ProductStatus) => {
    const current = filterConfig.statuses || []
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    updateFilter('statuses', updated)
  }

  const toggleVendor = (vendor: string) => {
    const current = filterConfig.vendors || []
    const updated = current.includes(vendor)
      ? current.filter(v => v !== vendor)
      : [...current, vendor]
    updateFilter('vendors', updated)
  }

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Categorías</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona las categorías de productos a incluir
        </p>
        <ScrollArea className="h-40 border rounded-md p-3">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay categorías disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filterConfig.categoryIds?.includes(category.id) || false}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Collections Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Colecciones</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona las colecciones de productos a incluir
        </p>
        <ScrollArea className="h-40 border rounded-md p-3">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay colecciones disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {collections.map(collection => (
                <div key={collection.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${collection.id}`}
                    checked={filterConfig.collectionIds?.includes(collection.id) || false}
                    onCheckedChange={() => toggleCollection(collection.id)}
                  />
                  <Label
                    htmlFor={`col-${collection.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {collection.title}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Stock Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Stock Disponible</Label>
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div>
            <p className="text-sm font-medium">Solo productos con stock</p>
            <p className="text-xs text-muted-foreground">
              Incluir solo productos que tengan unidades disponibles
            </p>
          </div>
          <Switch
            checked={filterConfig.hasStock || false}
            onCheckedChange={(checked) => updateFilter('hasStock', checked || undefined)}
          />
        </div>
      </div>

      {/* Price Range Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Rango de Precios</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="min-price" className="text-sm">Precio Mínimo</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={filterConfig.minPrice || ''}
              onChange={(e) => updateFilter('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-price" className="text-sm">Precio Máximo</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="Sin límite"
              min="0"
              step="0.01"
              value={filterConfig.maxPrice || ''}
              onChange={(e) => updateFilter('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      {/* Vendors Section */}
      {vendors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Proveedores / Marcas</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona los proveedores a incluir
          </p>
          <ScrollArea className="h-32 border rounded-md p-3">
            <div className="space-y-2">
              {vendors.map(vendor => (
                <div key={vendor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vendor-${vendor}`}
                    checked={filterConfig.vendors?.includes(vendor) || false}
                    onCheckedChange={() => toggleVendor(vendor)}
                  />
                  <Label
                    htmlFor={`vendor-${vendor}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {vendor}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Status Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Estado del Producto</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona los estados a incluir
        </p>
        <div className="space-y-2 border rounded-md p-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-active"
              checked={filterConfig.statuses?.includes(ProductStatus.ACTIVE) || false}
              onCheckedChange={() => toggleStatus(ProductStatus.ACTIVE)}
            />
            <Label htmlFor="status-active" className="text-sm font-normal cursor-pointer">
              Activo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-draft"
              checked={filterConfig.statuses?.includes(ProductStatus.DRAFT) || false}
              onCheckedChange={() => toggleStatus(ProductStatus.DRAFT)}
            />
            <Label htmlFor="status-draft" className="text-sm font-normal cursor-pointer">
              Borrador
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-archived"
              checked={filterConfig.statuses?.includes(ProductStatus.ARCHIVED) || false}
              onCheckedChange={() => toggleStatus(ProductStatus.ARCHIVED)}
            />
            <Label htmlFor="status-archived" className="text-sm font-normal cursor-pointer">
              Archivado
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}

