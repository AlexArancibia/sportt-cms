import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { slugify } from "@/lib/slugify"
import { ImagePlus } from "lucide-react"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { uploadAndGetUrl } from "@/lib/imageUploader"
import type { Category } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { ProductVariant, UpdateProductVariantDto } from "@/types/productVariant"
import type { Product } from "@/types/product"
import type { VariantPrice } from "@/types/variantPrice"

interface QuickEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
}

export function QuickEditDialog({ open, onOpenChange, product }: QuickEditDialogProps) {
  const { updateProduct, categories, collections, currencies, shopSettings, fetchCategories, fetchCollections } =
    useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<Product>(product)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  useEffect(() => {
    setFormData(product)
  }, [product])

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        setIsLoading(true)
        try {
          await Promise.all([fetchCategories(), fetchCollections()])
        } catch (error) {
          console.error("Failed to fetch categories or collections:", error)
          toast({
            title: "Error",
            description: "Failed to load categories and collections. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [open, fetchCategories, fetchCollections, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "title") {
      setFormData((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)),
    }))
  }

  const handleVariantPriceChange = (variantId: string, currencyId: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              prices: v.prices.some((p) => p.currencyId === currencyId)
                ? v.prices.map((p) => (p.currencyId === currencyId ? { ...p, price: value } : p))
                : [
                    ...v.prices,
                    {
                      id: `temp_${Date.now()}`, // Temporary ID
                      variantId: v.id,
                      currencyId,
                      price: value,
                      currency: currencies.find((c) => c.id === currencyId)!,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    } as VariantPrice,
                  ],
            }
          : v,
      ),
    }))
  }

  const handleImageUpload = async (variantId: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const uploadedUrl = await uploadAndGetUrl(file)
      if (!uploadedUrl) return

      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((v) => (v.id === variantId ? { ...v, imageUrl: getImageUrl(uploadedUrl) } : v)),
      }))
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedVariants: UpdateProductVariantDto[] = formData.variants.map((v) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        inventoryQuantity: v.inventoryQuantity,
        prices: v.prices,
        attributes: v.attributes,
        imageUrl: v.imageUrl,
        weightValue: v.weightValue,
        position: v.position,
      }))

      await updateProduct(product.id, {
        ...formData,
        categoryIds: formData.categories.map((c) => c.id),
        collectionIds: formData.collections.map((c) => c.id),
        variants: updatedVariants,
      })
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Name</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} />
                </div>
              </div>
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" name="vendor" value={formData.vendor || ""} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categories[0]?.id || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categories: [{ id: value } as Category] }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <Select
                    value={formData.collections[0]?.id || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, collections: [{ id: value } as Collection] }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading collections..." : "Select collection"} />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection: Collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Variants</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-0 w-[200px]">Nombre</TableHead>
 
                      <TableHead className="p-0  ">Peso</TableHead>
                      <TableHead className="p-0 ">Cantidad</TableHead>
                      {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                        <TableHead className="p-0  " key={currency.id}>
                          Precio ({currency.code})
                        </TableHead>
                      ))}
 
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.variants.map((variant) => (
                      <TableRow key={variant.id} className="content-font">
                        <TableCell className="p-1">
                          <div className="flex items-center gap-2">
                            
                            {variant.title}
                          </div>
                        </TableCell>
 
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={variant.weightValue}
                            onChange={(e) => handleVariantChange(variant.id, "weightValue", Number(e.target.value))}
                            className="bg-transparent border-0 content-font p-0 h-auto focus:ring-0 focus:outline-none"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={variant.inventoryQuantity}
                            onChange={(e) =>
                              handleVariantChange(variant.id, "inventoryQuantity", Number(e.target.value))
                            }
                            className="bg-transparent border-0 content-font p-0 h-auto focus:ring-0 focus:outline-none"
                          />
                        </TableCell>
                        {shopSettings?.[0]?.acceptedCurrencies.map((currency) => {
                          const variantPrice = variant.prices.find((p) => p.currencyId === currency.id)
                          return (
                            <TableCell key={currency.id} className="p-1">
                              <Input
                                type="number"
                                value={variantPrice?.price || ""}
                                onChange={(e) =>
                                  handleVariantPriceChange(variant.id, currency.id, Number(e.target.value))
                                }
                                className="bg-transparent border-0 content-font p-0 h-auto focus:ring-0 focus:outline-none"
                              />
                            </TableCell>
                          )
                        })}
 
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

