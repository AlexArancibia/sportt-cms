"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VariantImageGallery } from "./VariantImageGallery"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { CreateProductVariantDto } from "@/types/productVariant"

type VariantDto = UpdateProductVariantDto | CreateProductVariantDto

interface VariantsDetailTableProps<T extends VariantDto> {
  variants: T[]
  useVariants: boolean
  shopSettings: any[]
  formData?: any // Para productos simples (sin variantes)
  onVariantChange: (indexOrId: number | string, field: keyof T, value: any) => void
  onWeightChange: (indexOrId: number | string, value: string) => void
  onInventoryChange: (indexOrId: number | string, value: string) => void
  onInventoryBlur: (indexOrId: number | string, value: string) => void
  onPriceChange: (indexOrId: number | string, currencyId: string, value: string) => void
  onOriginalPriceChange: (indexOrId: number | string, currencyId: string, value: string) => void
  onImageUpload: (indexOrId: number | string) => void
  onImageRemove: (indexOrId: number | string, imageIndex: number) => void
  onProductImageRemove?: (imageIndex: number) => void
  mode?: "create" | "edit"
}

export function VariantsDetailTable<T extends VariantDto>({
  variants,
  useVariants,
  shopSettings,
  formData,
  onVariantChange,
  onWeightChange,
  onInventoryChange,
  onInventoryBlur,
  onPriceChange,
  onOriginalPriceChange,
  onImageUpload,
  onImageRemove,
  onProductImageRemove,
  mode = "create",
}: VariantsDetailTableProps<T>) {
  const [showScrollHint, setShowScrollHint] = useState(false)
  
  const getIdentifier = (variant: T, index: number) => {
    return mode === "edit" ? (variant as any).id : index
  }

  // Helper function to ensure values are never null for controlled inputs
  const safeValue = (value: any): string => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // Mobile Card Component
  const MobileVariantCard = ({ variant, index }: { variant: T; index: number }) => {
    const identifier = getIdentifier(variant, index)
    const images = useVariants ? (variant.imageUrls || []) : (formData?.imageUrls || [])
    const maxImages = useVariants ? 5 : 10

    return (
      <div className={`bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 ${
        !variant.isActive ? "opacity-60 bg-muted" : ""
      }`}>
        {/* Header with image and title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <VariantImageGallery
              images={images}
              maxImages={maxImages}
              onUpload={() => onImageUpload(identifier)}
              onRemove={(imageIndex) => {
                if (useVariants) {
                  onImageRemove(identifier, imageIndex)
                } else {
                  onProductImageRemove?.(imageIndex)
                }
              }}
              variantTitle={variant.title || "Product"}
            />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={safeValue(variant.title)}
              onChange={(e) => onVariantChange(identifier, "title" as keyof T, e.target.value)}
              className="w-full text-sm font-medium border-border focus:border-primary"
              placeholder="Nombre del producto"
            />
          </div>
        </div>

        {/* Basic info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">SKU</label>
            <Input
              value={safeValue(variant.sku)}
              onChange={(e) => onVariantChange(identifier, "sku" as keyof T, e.target.value)}
              className="w-full text-sm border-border focus:border-primary"
              placeholder="SKU"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Peso</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={safeValue(variant.weightValue)}
              onChange={(e) => onWeightChange(identifier, e.target.value)}
              className="w-full text-sm border-border focus:border-primary text-center"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Stock</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={safeValue(variant.inventoryQuantity)}
              onChange={(e) => onInventoryChange(identifier, e.target.value)}
              onBlur={(e) => onInventoryBlur(identifier, e.target.value)}
              className="w-full text-sm border-border focus:border-primary text-center"
              placeholder="0"
            />
          </div>
        </div>

        {/* Prices section */}
        {shopSettings?.[0]?.acceptedCurrencies && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Precios</h4>
            <div className="space-y-2">
              {shopSettings[0].acceptedCurrencies.map((currency: any) => (
                <div key={currency.id} className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Precio ({currency.code})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={safeValue(variant.prices?.find((p: any) => p.currencyId === currency.id)?.price)}
                      onChange={(e) => onPriceChange(identifier, currency.id, e.target.value)}
                      className="w-full text-sm border-border focus:border-primary text-center"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Original ({currency.code})
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={safeValue(variant.prices?.find((p: any) => p.currencyId === currency.id)?.originalPrice)}
                      onChange={(e) => onOriginalPriceChange(identifier, currency.id, e.target.value)}
                      className="w-full text-sm border-border focus:border-primary text-center"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attributes */}
        {useVariants && variant.attributes && Object.keys(variant.attributes).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Atributos</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(variant.attributes).map(([key, value]) => (
                <div key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Mobile Layout (< md) */}
      <div className="block md:hidden space-y-4">
        {variants.map((variant, index) => (
          <MobileVariantCard key={index} variant={variant} index={index} />
        ))}
      </div>

      {/* Desktop Layout (>= md) */}
      <div className="hidden md:block">
        {/* Scroll container with enhanced styling */}
        <div 
          className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted"
          onScroll={(e) => {
            const target = e.target as HTMLElement
            setShowScrollHint(target.scrollLeft < target.scrollWidth - target.clientWidth - 10)
          }}
        >
          {/* Scroll hint indicator */}
          {showScrollHint && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-primary text-primary-foreground rounded-full p-1 animate-pulse">
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
          
          <div className="min-w-[820px] lg:min-w-[980px] xl:min-w-[1120px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="sticky left-0 z-10 bg-card px-2.5 py-1.5 min-w-[220px] lg:min-w-[260px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Producto
                  </TableHead>
                  <TableHead className="px-2.5 py-1.5 min-w-[88px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">SKU</TableHead>
                  <TableHead className="px-2.5 py-1.5 min-w-[70px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peso</TableHead>
                  <TableHead className="px-2.5 py-1.5 min-w-[70px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stock</TableHead>
                  {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
                    <TableHead className="px-2.5 py-1.5 min-w-[84px] text-xs font-semibold uppercase tracking-wide text-muted-foreground" key={currency.id}>
                      <div className="space-y-0.5 text-center">
                        <div className="text-[10px] text-muted-foreground">{currency.code}</div>
                        <div className="text-[11px] text-foreground/80">Precio</div>
                      </div>
                    </TableHead>
                  ))}
                  {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
                    <TableHead className="px-2.5 py-1.5 min-w-[84px] text-xs font-semibold uppercase tracking-wide text-muted-foreground" key={`original-${currency.id}`}>
                      <div className="space-y-0.5 text-center">
                        <div className="text-[10px] text-muted-foreground">{currency.code}</div>
                        <div className="text-[11px] text-foreground/80">Original</div>
                      </div>
                    </TableHead>
                  ))}
                  {useVariants && (
                    <TableHead className="px-2.5 py-1.5 min-w-[110px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atributos</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => {
                  const identifier = getIdentifier(variant, index)
                  const images = useVariants ? (variant.imageUrls || []) : (formData?.imageUrls || [])
                  const maxImages = useVariants ? 5 : 10

                  return (
                    <TableRow
                      key={index}
                      className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${
                        !variant.isActive ? "opacity-70 bg-muted/50" : ""
                      }`}
                    >
                      {/* Producto - Sticky column */}
                      <TableCell className="sticky left-0 z-10 bg-card p-0">
                        <div className="flex items-center h-full">
                          <div className="flex-shrink-0 p-2">
                            <VariantImageGallery
                              images={images}
                              maxImages={maxImages}
                              onUpload={() => onImageUpload(identifier)}
                              onRemove={(imageIndex) => {
                                if (useVariants) {
                                  onImageRemove(identifier, imageIndex)
                                } else {
                                  onProductImageRemove?.(imageIndex)
                                }
                              }}
                              variantTitle={variant.title || "Product"}
                            />
                          </div>
                          <Input
                            value={safeValue(variant.title)}
                            onChange={(e) => onVariantChange(identifier, "title" as keyof T, e.target.value)}
                            className="flex-1 h-full border-0 px-2 py-1.5 text-sm font-medium bg-transparent focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="Nombre del producto"
                          />
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="p-0">
                        <Input
                          value={safeValue(variant.sku)}
                          onChange={(e) => onVariantChange(identifier, "sku" as keyof T, e.target.value)}
                          className="w-full h-full border-0 px-2 py-1.5 text-sm bg-transparent focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="SKU"
                        />
                      </TableCell>

                      {/* Peso */}
                      <TableCell className="p-0">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={safeValue(variant.weightValue)}
                          onChange={(e) => onWeightChange(identifier, e.target.value)}
                          className="w-full h-full border-0 px-2 py-1.5 text-sm bg-transparent text-center focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="0.00"
                        />
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="p-0">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={safeValue(variant.inventoryQuantity)}
                          onChange={(e) => onInventoryChange(identifier, e.target.value)}
                          onBlur={(e) => onInventoryBlur(identifier, e.target.value)}
                          className="w-full h-full border-0 px-2 py-1.5 text-sm bg-transparent text-center focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="0"
                        />
                      </TableCell>

                      {/* Precios */}
                      {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
                        <TableCell key={currency.id} className="p-0">
                          <Input
                            type="number"
                            step="0.01"
                            value={safeValue(variant.prices?.find((p: any) => p.currencyId === currency.id)?.price)}
                            onChange={(e) => onPriceChange(identifier, currency.id, e.target.value)}
                            className="w-full h-full border-0 px-2 py-1.5 text-sm bg-transparent text-center focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="0.00"
                          />
                        </TableCell>
                      ))}

                      {/* Precios Originales */}
                      {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
                        <TableCell key={`original-${currency.id}`} className="p-0">
                          <Input
                            type="number"
                            step="0.01"
                            value={safeValue(variant.prices?.find((p: any) => p.currencyId === currency.id)?.originalPrice)}
                            onChange={(e) => onOriginalPriceChange(identifier, currency.id, e.target.value)}
                            className="w-full h-full border-0 px-2 py-1.5 text-sm bg-transparent text-center focus:bg-muted/30 focus:border focus:border-primary/60 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            placeholder="0.00"
                          />
                        </TableCell>
                      ))}

                      {/* Atributos */}
                      {useVariants && (
                        <TableCell className="px-2.5 py-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(variant.attributes || {}).map(([key, value]) => (
                              <div key={key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                                <span className="font-medium text-foreground/70">{key}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
