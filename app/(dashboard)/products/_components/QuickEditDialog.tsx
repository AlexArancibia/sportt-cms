"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { slugify } from "@/lib/slugify"
import { ImagePlus, Save, Loader2, RefreshCw, Info, Settings, X } from 'lucide-react'
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import type { Category } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { ProductVariant } from "@/types/productVariant"
import type { Product } from "@/types/product"
import { MultiSelect } from "@/components/ui/multi-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ProductStatus } from "@/types/common"
import { uploadImage } from "@/app/actions/upload-file"

interface QuickEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
}

export function QuickEditDialog({ open, onOpenChange, product }: QuickEditDialogProps) {
  const {
    updateProduct,
    categories,
    collections,
    currencies,
    shopSettings,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    fetchProductById,
    currentStore,
  } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<Product>(product)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Reset form data when product changes or dialog opens
  useEffect(() => {
    const loadProductData = async () => {
      if (open && product && currentStore) {
        setIsLoading(true)
        try {
          // Fetch fresh product data
          const freshProduct = await fetchProductById(currentStore, product.id)
          setFormData(freshProduct)
        } catch (error) {
          console.error("Failed to fetch product:", error)
          // Si falla, usar los datos del prop
          setFormData(product)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadProductData()
  }, [product, open, currentStore])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && open) {
        e.preventDefault()
        formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }

      // Close on Escape
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Load categories and collections when dialog opens
  useEffect(() => {
    const loadData = async () => {
      if (open && currentStore) {
        try {
          await Promise.all([
            fetchCategoriesByStore(currentStore),
            fetchCollectionsByStore(currentStore)
          ])
        } catch (error) {
          console.error("Failed to fetch data:", error)
          toast({
            title: "Error",
            description: "Error al cargar los datos. Por favor, inténtelo de nuevo.",
            variant: "destructive",
          })
        }
      }
    }

    loadData()
  }, [open, currentStore, fetchCategoriesByStore, fetchCollectionsByStore, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generate slug from title
    if (name === "title") {
      setFormData((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  // Fix the handleVariantChange function to handle possibly undefined variants
  const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)) || [],
    }))
  }

  // Fix the handleVariantPriceChange function to handle possibly undefined variants
  const handleVariantPriceChange = (variantId: string, currencyId: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      variants:
        prev.variants?.map((v) => {
          if (v.id === variantId) {
            // Create a copy of the variant
            const updatedVariant = { ...v }

            // Ensure prices array exists
            if (!updatedVariant.prices) {
              updatedVariant.prices = []
            }

            // Find existing price for this currency
            const existingPriceIndex = updatedVariant.prices.findIndex((p) => p.currencyId === currencyId)

            if (existingPriceIndex >= 0) {
              // Update existing price
              const updatedPrices = [...updatedVariant.prices]
              updatedPrices[existingPriceIndex] = {
                ...updatedPrices[existingPriceIndex],
                price: value,
              }
              updatedVariant.prices = updatedPrices
            } else {
              // Add new price
              updatedVariant.prices.push({
                id: `temp_${Date.now()}`,
                variantId,
                currencyId,
                price: value,
                currency: currencies.find((c) => c.id === currencyId) || ({ id: currencyId } as any),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }

            return updatedVariant
          }
          return v
        }) || [],
    }))
  }

  // Updated function to handle multiple images
  const handleImageUpload = async (variantId: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    // NO multiple - solo una imagen a la vez
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const { success, presignedUrl, fileUrl, error } = await uploadImage(shopSettings[0]?.name, file.name, file.type)
        if (!success || !presignedUrl) {
          console.error("Error al obtener la presigned URL:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Sube el archivo directamente a R2 usando la presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) {
          console.error("Error subiendo el archivo:", uploadResponse.statusText)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Agregar la nueva imagen al array de imageUrls
        setFormData((prev) => ({
          ...prev,
          variants:
            prev.variants?.map((v) => {
              if (v.id === variantId) {
                // Add new image to existing imageUrls array
                const currentImages = v.imageUrls || []
                return { ...v, imageUrls: [...currentImages, fileUrl] }
              }
              return v
            }) || [],
        }))

        toast({
          title: "Imagen subida",
          description: "La imagen se subió correctamente",
        })
      } catch (error) {
        console.error("Error uploading file:", file.name, error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        })
      }
    }
    input.click()
  }

  // Function to remove an image from a variant
  const handleRemoveImage = (variantId: string, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variants:
        prev.variants?.map((v) => {
          if (v.id === variantId) {
            const updatedImages = [...(v.imageUrls || [])]
            updatedImages.splice(imageIndex, 1)
            return { ...v, imageUrls: updatedImages }
          }
          return v
        }) || [],
    }))
  }

  // Fix the handleSubmit function to handle possibly undefined variants
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Prepare update data similar to EditProductPage
      const updatedVariants = (formData.variants || []).map((variant) => {
        // Filter out fields that shouldn't be sent to the API
        const { id, productId, createdAt, updatedAt, ...cleanVariantData } = variant as any
        return cleanVariantData
      })

      const updatePayload = {
        ...formData,
        categoryIds: formData.categories?.map((c) => c.id) || [],
        collectionIds: formData.collections?.map((c) => c.id) || [],
        variants: updatedVariants,
      }

      // Send update request
      await updateProduct(product.id, updatePayload)

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to update product:", error)
      
      // Get specific error message from the API response
      let errorMessage = "Error al actualizar el producto. Por favor, inténtelo de nuevo."
      
      if (error?.response?.data?.message) {
        // If it's an array of validation errors, join them
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ")
        } else {
          errorMessage = error.response.data.message
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetSlug = () => {
    setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle>Edición Rápida de Producto</DialogTitle>
            {!isLoading && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.status === ProductStatus.ACTIVE}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: checked ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
                    }))
                  }
                />
                <span className="text-sm font-medium">
                  {formData.status === ProductStatus.ACTIVE ? (
                    <Badge className="bg-emerald-500">Activo</Badge>
                  ) : (
                    <Badge className="bg-gray-500">Borrador</Badge>
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pr-4">
            <Button variant="outline" size="sm" onClick={() => window.open(`/products/${product.id}/edit`, "_blank")}>
              <Settings className="h-4 w-4 mr-1" />
              Edición Completa
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-grow overflow-hidden p-6">
            <div className="space-y-6 animate-pulse">
              {/* Skeleton para Información General */}
              <div className="space-y-4">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton para Variantes */}
              <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="border rounded-lg p-4">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skeleton para Imágenes */}
              <div className="space-y-4">
                <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(70vh-100px)] pr-4">
              <div className="space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información General</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Nombre</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <div className="relative">
                      <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={resetSlug}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerar slug desde el título</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Proveedor</Label>
                    <Input id="vendor" name="vendor" value={formData.vendor || ""} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categorías</Label>
                    <MultiSelect
                      options={categories.map((category) => ({ label: category.name, value: category.id }))}
                      selected={formData.categories?.map((c) => c.id) || []}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          categories: selected.map((id) => categories.find((c) => c.id === id) || ({ id } as Category)),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="collection">Colecciones</Label>
                    <MultiSelect
                      options={collections.map((collection) => ({ label: collection.title, value: collection.id }))}
                      selected={formData.collections?.map((c) => c.id) || []}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          collections: selected.map(
                            (id) => collections.find((c) => c.id === id) || ({ id } as Collection),
                          ),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowBackorder"
                    checked={formData.allowBackorder || false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, allowBackorder: checked === true }))
                    }
                  />
                  <div className="flex flex-col">
                    <Label htmlFor="allowBackorder" className="flex items-center gap-2">
                      Permitir pedidos pendientes
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permitir a los clientes comprar productos que están fuera de stock</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Los clientes podrán comprar este producto aunque no haya stock disponible
                    </span>
                  </div>
                </div>
              </div>

              {/* Variantes */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Variantes del Producto ({formData.variants?.length || 0})</h3>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Imágenes</th>
                        <th className="text-left p-3 font-medium text-sm">Nombre</th>
                        <th className="text-left p-3 font-medium text-sm">SKU</th>
                        <th className="text-left p-3 font-medium text-sm">Inventario</th>
                        <th className="text-left p-3 font-medium text-sm">Peso</th>
                        {shopSettings?.[0]?.acceptedCurrencies?.map((currency) => (
                          <th key={currency.id} className="text-left p-3 font-medium text-sm">
                            Precio ({currency.code})
                          </th>
                        ))}
                        <th className="text-left p-3 font-medium text-sm">Activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants?.map((variant) => (
                        <tr key={variant.id} className="border-t">
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {/* Display existing images */}
                              {variant.imageUrls?.map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative w-8 h-8 bg-accent rounded-md overflow-hidden group"
                                >
                                  <Image
                                    src={getImageUrl(imageUrl) || "/placeholder.svg"}
                                    alt={`${variant.title} - ${index + 1}`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-1 -right-1 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveImage(variant.id, index)}
                                  >
                                    <X className="w-2 h-2" />
                                  </Button>
                                </div>
                              ))}
                              {/* Add image button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 border-2 border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50"
                                onClick={() => handleImageUpload(variant.id)}
                              >
                                <ImagePlus className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              value={variant.title}
                              onChange={(e) => handleVariantChange(variant.id, "title", e.target.value)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={variant.sku || ""}
                              onChange={(e) => handleVariantChange(variant.id, "sku", e.target.value)}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={variant.inventoryQuantity || 0}
                              onChange={(e) =>
                                handleVariantChange(variant.id, "inventoryQuantity", Number(e.target.value))
                              }
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={variant.weightValue || 0}
                              onChange={(e) => handleVariantChange(variant.id, "weightValue", Number(e.target.value))}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          {shopSettings?.[0]?.acceptedCurrencies?.map((currency) => {
                            const variantPrice = variant.prices?.find((p) => p.currencyId === currency.id)
                            return (
                              <td key={currency.id} className="p-3">
                                <Input
                                  type="number"
                                  value={variantPrice?.price || ""}
                                  onChange={(e) =>
                                    handleVariantPriceChange(variant.id, currency.id, Number(e.target.value))
                                  }
                                  className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </td>
                            )
                          })}
                          <td className="p-3">
                            <div className="flex justify-center">
                              <Switch
                                checked={variant.isActive !== false}
                                onCheckedChange={(checked) => {
                                  handleVariantChange(variant.id, "isActive", checked)
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
            <div className="flex-1 text-xs text-muted-foreground">
              Presiona <kbd className="px-1 py-0.5 bg-muted rounded border">Ctrl</kbd> +{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded border">S</kbd> para guardar
            </div>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}