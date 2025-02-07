"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Search, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getImageUrl } from "@/lib/imageUtils"
import { Checkbox } from "@/components/ui/checkbox"
import type { Product } from "@/types/product"
import type { ProductVariant } from "@/types/productVariant"
import { useMainStore } from "@/stores/mainStore"

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
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [products, searchQuery])

  const handleItemToggle = (productId: string, variantId: string | null) => {
    setSelectedItems((prev) => {
      const existingItemIndex = prev.findIndex((item) => item.productId === productId && item.variantId === variantId)
      if (existingItemIndex !== -1) {
        return prev.filter((_, index) => index !== existingItemIndex)
      } else {
        return [...prev, { productId, variantId }]
      }
    })
  }

  const handleConfirm = () => {
    onConfirm(selectedItems)
    onOpenChange(false)
  }

  const getVariantPrice = (variant: ProductVariant): number => {
    const price = variant.prices.find((p) => p.currency.id === selectedCurrency)
    return price?.price || 0
  }

  const getProductPrice = (product: Product): number => {
    const price = product.prices.find((p) => p.currencyId === selectedCurrency)
    return price?.price || 0
  }

  const renderProductCard = (product: Product) => (
    <div key={product.id} className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <Image
          src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
          alt={product.title}
          width={60}
          height={60}
          className="rounded-md mr-4 object-cover"
        />
        <div>
          <h3 className="font-semibold text-base">{product.title}</h3>
          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
        </div>
      </div>
      {product.variants.length > 0 ? (
        product.variants.map((variant) => (
          <div key={variant.id} className="flex justify-between items-center mt-3 py-2 border-t">
            <div className="flex items-center">
              <Checkbox
                checked={selectedItems.some((item) => item.productId === product.id && item.variantId === variant.id)}
                onCheckedChange={() => handleItemToggle(product.id, variant.id)}
                className="mr-2"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{variant.title}</span>
                <span className="text-xs text-gray-500">
                  Stock: {variant.inventoryQuantity} | Peso: {variant.weightValue}kg
                </span>
              </div>
            </div>
            <span className="font-medium">
              {formatCurrency(getVariantPrice(variant), currencies.find((c) => c.id === selectedCurrency)?.code)}
            </span>
          </div>
        ))
      ) : (
        <div className="flex justify-between items-center mt-3 py-2 border-t">
          <div className="flex items-center">
            <Checkbox
              checked={selectedItems.some((item) => item.productId === product.id && item.variantId === null)}
              onCheckedChange={() => handleItemToggle(product.id, null)}
              className="mr-2"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{product.title}</span>
              <span className="text-xs text-gray-500">
                Stock: {product.inventoryQuantity} | Peso: {product.weightValue}kg
              </span>
            </div>
          </div>
          <span className="font-medium">
            {formatCurrency(getProductPrice(product), currencies.find((c) => c.id === selectedCurrency)?.code)}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Agregar Productos al Pedido</DialogTitle>
        </DialogHeader>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar productos por nombre o SKU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-2 text-base"
          />
        </div>
        <ScrollArea className="h-[60vh] pr-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(renderProductCard)
          ) : (
            <p className="text-center text-gray-500 mt-4">No se encontraron productos que coincidan con la búsqueda.</p>
          )}
        </ScrollArea>
        <DialogFooter className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
            <span className="font-medium text-base">Seleccionados: {selectedItems.length}</span>
          </div>
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-3">
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

