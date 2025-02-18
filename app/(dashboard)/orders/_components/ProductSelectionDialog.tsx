"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Search, ShoppingCart, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getImageUrl } from "@/lib/imageUtils"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/types/product"
import type { ProductVariant } from "@/types/productVariant"
import { useMainStore } from "@/stores/mainStore"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ProductSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  selectedCurrency: string
  onConfirm: (selections: Array<{ productId: string; variantId: string | null }>) => void
  currentLineItems: Array<{ productId: string; variantId: string | null }>
}

export function ProductSelectionDialog({
  open,
  onOpenChange,
  products,
  selectedCurrency,
  onConfirm,
  currentLineItems,
}: ProductSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; variantId: string | null }>>([])
  const { currencies } = useMainStore()

  useEffect(() => {
    if (open) {
      setSelectedItems(currentLineItems)
    }
  }, [open, currentLineItems])

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [products, searchQuery])

  const handleItemToggle = useCallback((productId: string, variantId: string | null) => {
    setSelectedItems((prev) => {
      const existingItemIndex = prev.findIndex((item) => item.productId === productId && item.variantId === variantId)
      if (existingItemIndex !== -1) {
        return prev.filter((_, index) => index !== existingItemIndex)
      } else {
        return [...prev, { productId, variantId }]
      }
    })
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(selectedItems)
    onOpenChange(false)
  }, [onConfirm, selectedItems, onOpenChange])

  const getVariantPrice = useMemo(() => {
    return (variant: ProductVariant): number => {
      const price = variant.prices.find((p) => p.currency.id === selectedCurrency)
      return price?.price || 0
    }
  }, [selectedCurrency])

  const memoizedFormatCurrency = useMemo(() => {
    const selectedCurrencyObj = currencies.find((c) => c.id === selectedCurrency)
    const currencyCode = selectedCurrencyObj?.code
    const cache = new Map<number, string>()

    return (amount: number) => {
      const cached = cache.get(amount)
      if (cached) return cached

      const formatted = formatCurrency(amount, currencyCode)
      cache.set(amount, formatted)
      return formatted
    }
  }, [currencies, selectedCurrency])

  const renderProductCard = useCallback(
    (product: Product) => (
      <Accordion type="single" collapsible className="w-full" key={product.id}>
        <AccordionItem value={product.id} className="border-b border-border">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center w-full">
              <div className="w-16 h-16 rounded-md border overflow-hidden flex-shrink-0 mr-4">
                <Image
                  src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                  alt={product.title}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-grow text-left">
                <h3 className="font-medium text-base">{product.title}</h3>
                <p className="text-sm text-muted-foreground">{product.vendor}</p>
              </div>
              
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {product.variants.length > 0 ? (
                product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between py-2 hover:bg-accent rounded-md px-2"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedItems.some(
                          (item) => item.productId === product.id && item.variantId === variant.id,
                        )}
                        onCheckedChange={(checked) => handleItemToggle(product.id, variant.id)}
                        className="mr-2"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{variant.title}</span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {variant.inventoryQuantity} | Peso: {variant.weightValue}kg
                        </span>
                      </div>
                    </div>
                    <span className="font-medium text-sm">{memoizedFormatCurrency(getVariantPrice(variant))}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between py-2 hover:bg-accent rounded-md px-2">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedItems.some((item) => item.productId === product.id && item.variantId === null)}
                      onCheckedChange={(checked) => handleItemToggle(product.id, null)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">{product.title}</span>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    [selectedItems, handleItemToggle, getVariantPrice, memoizedFormatCurrency],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className=" mb-4">Agregar Productos al Pedido</DialogTitle>
        </DialogHeader>
        <div className=" relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos por nombre o SKU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 py-2"
          />
        </div>
        <ScrollArea className="h-[60vh] pr-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(renderProductCard)
          ) : (
            <p className="text-center text-muted-foreground mt-4">
              No se encontraron productos que coincidan con la búsqueda.
            </p>
          )}
        </ScrollArea>
        <DialogFooter className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="flex items-center text-muted-foreground">
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="text-sm">Seleccionados: {selectedItems.length}</span>
          </div>
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Confirmar Selección
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

