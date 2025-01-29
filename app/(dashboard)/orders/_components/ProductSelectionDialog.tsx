"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getImageUrl } from "@/lib/imageUtils"
import type { Product,  } from "@/types/product"
import type { ProductPrice } from "@/types/productPrice"
import { ProductVariant } from "@/types/productVariant"
import { useMainStore } from "@/stores/mainStore"


interface ProductSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  selectedCurrency: string
  onConfirm: (selections: Array<{ productId: string; variantId: string; quantity: number }>) => void
}

export function ProductSelectionDialog({
  open,
  onOpenChange,
  products,
  selectedCurrency,
  onConfirm,
}: ProductSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; variantId: string; quantity: number }>>(
    [],
  )
  const {currencies} = useMainStore()
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCheckboxChange = (productId: string, variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { productId, variantId, quantity: 1 }])
    } else {
      setSelectedItems((prev) => prev.filter((item) => !(item.productId === productId && item.variantId === variantId)))
    }
  }

  const handleConfirm = () => {
    onConfirm(selectedItems)
    onOpenChange(false)
  }

  const getVariantPrice = (variant: ProductVariant): number => {
    const price = variant.prices.find((p) => p.currency.id === selectedCurrency)
    return price?.price || 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add product from Default Channel</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {!imageError[product.id] && product.imageUrls && product.imageUrls.length > 0 && (
                    <div className="relative w-16 h-16">
                      <Image
                        src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        sizes="64px"
                        className="object-cover rounded"
                        onError={() => setImageError((prev) => ({ ...prev, [product.id]: true }))}
                      />
                    </div>
                  )}
                  <span className="font-medium">{product.title}</span>
                </div>

                <div className="pl-10 space-y-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedItems.some(
                      (item) => item.productId === product.id && item.variantId === variant.id,
                    )
                    const price = getVariantPrice(variant)

                    return (
                      <div key={variant.id} className="flex items-center justify-between pr-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(product.id, variant.id, checked as boolean)
                            }
                          />
                          <div className="flex flex-col">
                            <span>{variant.title}</span>
                            <span className="text-sm text-muted-foreground">SKU {variant.sku}</span>
                          </div>
                        </div>
                        <span className="font-medium">{formatCurrency(price, currencies.find((c)=>c.id === selectedCurrency)?.code)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

