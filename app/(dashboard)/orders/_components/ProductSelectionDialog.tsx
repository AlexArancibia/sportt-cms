"use client"

import { useState, useEffect, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Product } from "@/types/product"

interface ProductSelection {
  productId: string
  variantId: string | null
}

interface ProductSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  selectedCurrency: string
  onConfirm: (selections: ProductSelection[]) => void
  currentLineItems: ProductSelection[]
}

export const ProductSelectionDialog = memo(function ProductSelectionDialog({
  open,
  onOpenChange,
  products,
  selectedCurrency,
  onConfirm,
  currentLineItems,
}: ProductSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([])
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      // Iniciar con una selección vacía en lugar de mantener la anterior
      setSelectedProducts([])
      setSelectedVariants({})
    }
  }, [open])

  const filteredProducts = products.filter((product) => product.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (checked) {
      // Find the product
      const product = products.find((p) => p.id === productId)

      if (product && product.variants.length > 0) {
        // Select the first variant by default
        setSelectedVariants((prev) => ({
          ...prev,
          [productId]: product.variants[0].id,
        }))

        setSelectedProducts((prev) => [...prev, { productId, variantId: product.variants[0].id }])
      } else {
        setSelectedProducts((prev) => [...prev, { productId, variantId: null }])
      }
    } else {
      setSelectedProducts((prev) => prev.filter((item) => item.productId !== productId))

      // Remove from selected variants
      setSelectedVariants((prev) => {
        const newVariants = { ...prev }
        delete newVariants[productId]
        return newVariants
      })
    }
  }

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }))

    setSelectedProducts((prev) => prev.map((item) => (item.productId === productId ? { ...item, variantId } : item)))
  }

  const handleConfirm = () => {
    onConfirm(selectedProducts)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Productos</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isSelected = selectedProducts.some((item) => item.productId === product.id)

                return (
                  <div key={product.id} className="border rounded-md p-4">
                    <div className="flex items-start gap-4">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img
                          src={product.imageUrls[0] || "/placeholder.svg"}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                          No img
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleProductToggle(product.id, checked === true)}
                          />
                          <Label htmlFor={`product-${product.id}`} className="font-medium cursor-pointer">
                            {product.title}
                          </Label>
                        </div>

                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}

                        {isSelected && product.variants.length > 1 && (
                          <div className="mt-2">
                            <Label htmlFor={`variant-${product.id}`} className="text-sm mb-1 block">
                              Variante
                            </Label>
                            <Select
                              value={selectedVariants[product.id] || product.variants[0].id}
                              onValueChange={(value) => handleVariantChange(product.id, value)}
                            >
                              <SelectTrigger id={`variant-${product.id}`} className="w-full">
                                <SelectValue placeholder="Seleccionar variante" />
                              </SelectTrigger>
                              <SelectContent>
                                {product.variants.map((variant) => (
                                  <SelectItem key={variant.id} value={variant.id}>
                                    {variant.title || product.title}{" "}
                                    {selectedCurrency &&
                                      variant.prices.find((p) => p.currencyId === selectedCurrency) &&
                                      `(${variant.prices
                                        .find((p) => p.currencyId === selectedCurrency)
                                        ?.price.toFixed(2)})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedProducts.length === 0}>
            Confirmar ({selectedProducts.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
