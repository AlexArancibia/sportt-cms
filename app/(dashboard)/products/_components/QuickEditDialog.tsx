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
import { ImagePlus, Save, X, Loader2, RefreshCw, Info, Settings } from "lucide-react"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { uploadAndGetUrl } from "@/lib/imageUploader"
import type { Category } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { ProductVariant, UpdateProductVariantDto } from "@/types/productVariant"
import type { Product } from "@/types/product"
import type { VariantPrice } from "@/types/variantPrice"
import { MultiSelect } from "@/components/ui/multi-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ProductStatus } from "@/types/common"

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
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

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
          console.error("Failed to fetch data:", error)
          toast({
            title: "Error",
            description: "Error al cargar los datos. Por favor, inténtelo de nuevo.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [open, fetchCategories, fetchCollections, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "title") {
      setFormData((prev) => ({ ...prev, slug: slugify(value) }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVariantChange = (variantId: string, field: keyof ProductVariant, value: string | number | boolean) => {
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

      try {
        const uploadedUrl = await uploadAndGetUrl(file)
        if (!uploadedUrl) return

        setFormData((prev) => ({
          ...prev,
          variants: prev.variants.map((v) => (v.id === variantId ? { ...v, imageUrl: getImageUrl(uploadedUrl) } : v)),
        }))

        toast({
          title: "Imagen subida",
          description: "La imagen se ha subido correctamente",
        })
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          title: "Error",
          description: "Error al subir la imagen. Por favor, inténtelo de nuevo.",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
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
        isActive: v.isActive,
      }))

      await updateProduct(product.id, {
        ...formData,
        categoryIds: formData.categories.map((c) => c.id),
        collectionIds: formData.collections.map((c) => c.id),
        variants: updatedVariants,
      })
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el producto. Por favor, inténtelo de nuevo.",
        variant: "destructive",
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
          </div>
          <div className="flex items-center gap-2 pr-4">
 
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/products/${product.id}/edit`, "_blank")}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Edición Completa
                  </Button>
                 
          </div>
        </DialogHeader>
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
                      selected={formData.categories.map((c) => c.id)}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          categories: selected.map((id) => ({ id }) as Category),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="collection">Colecciones</Label>
                    <MultiSelect
                      options={collections.map((collection) => ({ label: collection.title, value: collection.id }))}
                      selected={formData.collections.map((c) => c.id)}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          collections: selected.map((id) => ({ id }) as Collection),
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
                <h3 className="text-lg font-medium">Variantes del Producto ({formData.variants.length})</h3>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Nombre</th>
                        <th className="text-left p-3 font-medium text-sm">SKU</th>
                        <th className="text-left p-3 font-medium text-sm">Inventario</th>
                        <th className="text-left p-3 font-medium text-sm">Peso</th>
                        {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                          <th key={currency.id} className="text-left p-3 font-medium text-sm">
                            Precio ({currency.code})
                          </th>
                        ))}
                        <th className="text-left p-3 font-medium text-sm">Activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((variant, index) => (
                        <tr key={variant.id} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 bg-accent rounded-md overflow-hidden">
                                {variant.imageUrl ? (
                                  <Image
                                    src={getImageUrl(variant.imageUrl) || "/placeholder.svg"}
                                    alt={variant.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md"
                                  />
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-full p-0"
                                    onClick={() => handleImageUpload(variant.id)}
                                  >
                                    <ImagePlus className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={variant.title}
                                onChange={(e) => handleVariantChange(variant.id, "title", e.target.value)}
                                className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
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
                              value={variant.inventoryQuantity}
                              onChange={(e) =>
                                handleVariantChange(variant.id, "inventoryQuantity", Number(e.target.value))
                              }
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={variant.weightValue}
                              onChange={(e) => handleVariantChange(variant.id, "weightValue", Number(e.target.value))}
                              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </td>
                          {shopSettings?.[0]?.acceptedCurrencies.map((currency) => {
                            const variantPrice = variant.prices.find((p) => p.currencyId === currency.id)
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
      </DialogContent>
    </Dialog>
  )
}

