"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PDFExportConfig, PDFLayoutType } from "@/types/pdf-export"
import { Currency } from "@/types/currency"
import { LayoutGrid, List, Table, Package, DollarSign } from "lucide-react"

interface DesignTabProps {
  designConfig: PDFExportConfig
  onDesignChange: (config: PDFExportConfig) => void
  storeLogo?: string
  currencies?: Currency[]
  defaultCurrencyId?: string
}

export function DesignTab({ 
  designConfig, 
  onDesignChange, 
  storeLogo, 
  currencies = [],
  defaultCurrencyId 
}: DesignTabProps) {
  const updateDesign = (key: keyof PDFExportConfig, value: any) => {
    onDesignChange({ ...designConfig, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      {currencies.length > 0 && (
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">Moneda</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona la moneda para mostrar los precios
            </p>
          </div>
          <Select
            value={designConfig.currencyId || defaultCurrencyId}
            onValueChange={(value) => updateDesign('currencyId', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.name} ({currency.symbol}) - {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color Configuration */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Colores del PDF</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Personaliza los colores del catálogo
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color" className="text-sm">Color Primario</Label>
            <div className="flex items-center gap-2">
              <input
                id="primary-color"
                type="color"
                value={designConfig.primaryColor}
                onChange={(e) => updateDesign('primaryColor', e.target.value)}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={designConfig.primaryColor}
                onChange={(e) => updateDesign('primaryColor', e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color" className="text-sm">Color Secundario</Label>
            <div className="flex items-center gap-2">
              <input
                id="secondary-color"
                type="color"
                value={designConfig.secondaryColor}
                onChange={(e) => updateDesign('secondaryColor', e.target.value)}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={designConfig.secondaryColor}
                onChange={(e) => updateDesign('secondaryColor', e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo Configuration */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Logo de Tienda</Label>
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex-1">
            <p className="text-sm font-medium">Incluir logo en el PDF</p>
            <p className="text-xs text-muted-foreground">
              {storeLogo ? 'El logo aparecerá en el encabezado' : 'No hay logo configurado en la tienda'}
            </p>
          </div>
          <Switch
            checked={designConfig.includeLogo && !!storeLogo}
            onCheckedChange={(checked) => updateDesign('includeLogo', checked)}
            disabled={!storeLogo}
          />
        </div>
        
        {storeLogo && designConfig.includeLogo && (
          <div className="p-3 border rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Vista previa del logo:</p>
            <img 
              src={storeLogo} 
              alt="Logo preview" 
              className="max-h-16 max-w-32 object-contain"
            />
          </div>
        )}
      </div>

      {/* Layout Configuration */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Tipo de Layout</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona cómo se mostrarán los productos
          </p>
        </div>

        <RadioGroup
          value={designConfig.layout}
          onValueChange={(value) => updateDesign('layout', value as PDFLayoutType)}
          className="space-y-2"
        >
          {/* Grid Layout */}
          <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="grid" id="layout-grid" />
            <Label htmlFor="layout-grid" className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="p-2 rounded bg-primary/10">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Grid / Cuadrícula</p>
                <p className="text-xs text-muted-foreground">
                  Tarjetas en múltiples columnas, ideal para catálogos visuales
                </p>
              </div>
            </Label>
          </div>

          {/* List Layout */}
          <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="list" id="layout-list" />
            <Label htmlFor="layout-list" className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="p-2 rounded bg-primary/10">
                <List className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Lista</p>
                <p className="text-xs text-muted-foreground">
                  Filas completas con detalles, mejor para descripciones largas
                </p>
              </div>
            </Label>
          </div>

          {/* Table Layout */}
          <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="table" id="layout-table" />
            <Label htmlFor="layout-table" className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="p-2 rounded bg-primary/10">
                <Table className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Tabla</p>
                <p className="text-xs text-muted-foreground">
                  Formato tabular compacto, ideal para listas de precios
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Images Configuration */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Imágenes</Label>
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div>
            <p className="text-sm font-medium">Incluir imágenes de productos</p>
            <p className="text-xs text-muted-foreground">
              Las imágenes pueden aumentar el tamaño del PDF
            </p>
          </div>
          <Switch
            checked={designConfig.includeImages}
            onCheckedChange={(checked) => updateDesign('includeImages', checked)}
          />
        </div>
      </div>

      {/* Product Filters */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Filtros de Productos</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Filtra los productos que se incluirán en el PDF
          </p>
        </div>

        <div className="space-y-3">
          {/* Filter: Only in stock */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3 flex-1">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Solo en stock</p>
                <p className="text-xs text-muted-foreground">
                  Incluir solo productos con al menos una variante con stock disponible
                </p>
              </div>
            </div>
            <Checkbox
              checked={designConfig.filterOnlyInStock ?? true}
              onCheckedChange={(checked) => updateDesign('filterOnlyInStock', checked)}
            />
          </div>

          {/* Filter: Price greater than zero */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3 flex-1">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Precios mayor a 0</p>
                <p className="text-xs text-muted-foreground">
                  Incluir solo productos con al menos un precio mayor a cero
                </p>
              </div>
            </div>
            <Checkbox
              checked={designConfig.filterPriceGreaterThanZero ?? true}
              onCheckedChange={(checked) => updateDesign('filterPriceGreaterThanZero', checked)}
            />
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="p-4 border rounded-md bg-muted/30">
        <p className="text-sm font-medium mb-2">Configuración actual:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Layout: <span className="font-medium text-foreground">
            {designConfig.layout === 'grid' ? 'Cuadrícula' : designConfig.layout === 'list' ? 'Lista' : 'Tabla'}
          </span></li>
          <li>• Imágenes: <span className="font-medium text-foreground">
            {designConfig.includeImages ? 'Incluidas' : 'No incluidas'}
          </span></li>
          <li>• Logo: <span className="font-medium text-foreground">
            {designConfig.includeLogo && storeLogo ? 'Incluido' : 'No incluido'}
          </span></li>
        </ul>
      </div>
    </div>
  )
}
