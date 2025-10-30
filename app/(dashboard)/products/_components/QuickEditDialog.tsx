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
import { Save, Loader2, RefreshCw, Info, Settings } from 'lucide-react'
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
import { useVariantHandlers } from "../_hooks/useVariantHandlers"
import { useProductImageUpload } from "../_hooks/useProductImageUpload"
import { VariantImageGallery } from "./shared/VariantImageGallery"
import { VariantsDetailTable } from "./shared/VariantsDetailTable"
import type { UpdateProductDto } from "@/types/product"
import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { CreateVariantPriceDto } from "@/types/variantPrice"

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
  const [originalData, setOriginalData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Usar hooks compartidos
  const variantHandlers = useVariantHandlers(
    formData.variants || [],
    (updater) => {
      setFormData((prev) => ({
        ...prev,
        variants: typeof updater === 'function' ? updater(prev.variants || []) : updater
      }))
    }
  )
  const imageUpload = useProductImageUpload(currentStore)
  

  // Reset form data when product changes or dialog opens
  useEffect(() => {
    const loadProductData = async () => {
      if (open && product && currentStore) {
        setIsLoading(true)
        try {
          // Fetch fresh product data
          const freshProduct = await fetchProductById(currentStore, product.id)
          setFormData(freshProduct)
          setOriginalData(freshProduct) // Guardar datos originales para comparación
        } catch (error) {
          console.error("Failed to fetch product:", error)
          // Si falla, usar los datos del prop
          setFormData(product)
          setOriginalData(product)
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
            fetchCategoriesByStore(currentStore, { limit: 50 }),
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

  // Usar los handlers del hook compartido
  const handleVariantChange = variantHandlers.handleVariantChange
  const handleWeightChange = variantHandlers.handleWeightChange
  const handleInventoryChange = variantHandlers.handleInventoryChange
  const handleInventoryBlur = variantHandlers.handleInventoryBlur

  // Handler de precio con conversión automática
  const handleVariantPriceChange = (variantId: string, currencyId: string, value: number) => {
    const exchangeRates = useMainStore.getState().exchangeRates
    variantHandlers.handlePriceChange(variantId, currencyId, value, exchangeRates, shopSettings)
  }

  // Handler de precio original con conversión automática
  const handleVariantOriginalPriceChange = (variantId: string, currencyId: string, originalPrice: number | null) => {
    const exchangeRates = useMainStore.getState().exchangeRates
    variantHandlers.handleOriginalPriceChange(variantId, currencyId, originalPrice, exchangeRates, shopSettings)
  }

  // Manejo de imágenes usando el hook compartido
  const handleImageUpload = (variantId: string) => {
    const isSimpleProduct = (formData.variants?.length || 0) <= 1
    const maxImages = isSimpleProduct ? 10 : 5
    const currentCount = isSimpleProduct
      ? formData.imageUrls?.length || 0
      : formData.variants?.find(v => v.id === variantId)?.imageUrls?.length || 0

    imageUpload.handleImageUpload((fileUrl) => {
      if (isSimpleProduct) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...(prev.imageUrls || []), fileUrl]
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          variants: prev.variants?.map((v) => {
            if (v.id === variantId) {
              return { ...v, imageUrls: [...(v.imageUrls || []), fileUrl] }
            }
            return v
          }) || [],
        }))
      }
    }, maxImages, currentCount)
  }

  // Función para eliminar imagen
  const handleRemoveImage = (variantId: string, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants?.map((v) => {
        if (v.id === variantId) {
          const updatedImages = [...(v.imageUrls || [])]
          updatedImages.splice(imageIndex, 1)
          return { ...v, imageUrls: updatedImages }
        }
        return v
      }) || [],
    }))
  }

  // Función para filtrar valores vacíos, null o undefined
  const filterEmptyValues = (obj: Record<string, unknown>): Record<string, unknown> => {
    const filtered: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Filtrar valores null, undefined y strings vacíos
      if (value === null || value === undefined || value === "") {
        continue
      }
      
      if (Array.isArray(value)) {
        // Solo incluir arrays que no estén vacíos
        if (value.length > 0) {
          filtered[key] = value
        }
      } else if (typeof value === "object" && value !== null) {
        // Para objetos, aplicar recursivamente el filtrado
        const filteredObj = filterEmptyValues(value as Record<string, unknown>)
        if (Object.keys(filteredObj).length > 0) {
          filtered[key] = filteredObj
        }
      } else {
        // Para valores primitivos, incluir si no están vacíos
        filtered[key] = value
      }
    }
    
    return filtered
  }

  // Función para comparar datos originales con actuales y detectar cambios
  const getChangedFields = (original: Record<string, unknown>, current: Record<string, unknown>): Record<string, unknown> => {
    const changes: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(current)) {
      const originalValue = original[key]
      
      // Manejo especial para fechas
      if (key === 'releaseDate') {
        const originalDate = originalValue && typeof originalValue === 'string' ? new Date(originalValue).toISOString() : null
        const currentDate = value && typeof value === 'string' ? new Date(value).toISOString() : null
        if (originalDate !== currentDate) {
          changes[key] = value
        }
      } else if (key === 'variants') {
        // Solo comparar variantes si realmente han cambiado
        const originalVariants = Array.isArray(originalValue) ? originalValue : []
        const currentVariants = Array.isArray(value) ? value : []
        
        // Si el número de variantes cambió, incluir todas
        if (originalVariants.length !== currentVariants.length) {
          changes[key] = currentVariants
        } else {
          // Comparar cada variante individualmente, pero de forma más precisa
          const hasChanges = currentVariants.some((currentVariant: unknown, index: number) => {
            const originalVariant = originalVariants[index]
            if (!originalVariant) return true
            
            // Crear objetos limpios para comparación, excluyendo campos que pueden cambiar automáticamente
            const cleanCurrent = {
              title: (currentVariant as Record<string, unknown>).title,
              sku: (currentVariant as Record<string, unknown>).sku,
              imageUrls: (currentVariant as Record<string, unknown>).imageUrls,
              inventoryQuantity: (currentVariant as Record<string, unknown>).inventoryQuantity,
              weightValue: (currentVariant as Record<string, unknown>).weightValue,
              isActive: (currentVariant as Record<string, unknown>).isActive,
              position: (currentVariant as Record<string, unknown>).position,
              attributes: (currentVariant as Record<string, unknown>).attributes,
              prices: (currentVariant as Record<string, unknown>).prices
            }
            
            const cleanOriginal = {
              title: (originalVariant as Record<string, unknown>).title,
              sku: (originalVariant as Record<string, unknown>).sku,
              imageUrls: (originalVariant as Record<string, unknown>).imageUrls,
              inventoryQuantity: (originalVariant as Record<string, unknown>).inventoryQuantity,
              weightValue: (originalVariant as Record<string, unknown>).weightValue,
              isActive: (originalVariant as Record<string, unknown>).isActive,
              position: (originalVariant as Record<string, unknown>).position,
              attributes: (originalVariant as Record<string, unknown>).attributes,
              prices: (originalVariant as Record<string, unknown>).prices
            }
            
            return JSON.stringify(cleanCurrent) !== JSON.stringify(cleanOriginal)
          })
          
          if (hasChanges) {
            changes[key] = currentVariants
          }
        }
      } else {
        // Comparación normal para otros campos
        if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
          changes[key] = value
        }
      }
    }
    
    return changes
  }

  // Función para generar el payload que se enviará al backend
  const generatePayload = (): Record<string, unknown> => {
    if (!originalData) {
      throw new Error("Original data not available for comparison")
    }

    // Preparar datos actuales para comparación
    const truncateToTwoDecimals = (value: number): number => {
      return Math.trunc(Number(value) * 100) / 100
    }
    const currentData = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      vendor: formData.vendor,
      allowBackorder: formData.allowBackorder,
      releaseDate: formData.releaseDate,
      status: formData.status,
      restockThreshold: formData.restockThreshold,
      restockNotify: formData.restockNotify,
      categoryIds: formData.categories?.map((c) => c.id) || [],
      collectionIds: formData.collections?.map((c) => c.id) || [],
      imageUrls: formData.imageUrls,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      variants: (formData.variants || []).map(variant => {
        const variantPayload: Record<string, unknown> = {
          title: variant.title,
          prices: variant.prices?.map((price: CreateVariantPriceDto) => ({
            currencyId: price.currencyId,
            price: truncateToTwoDecimals(Number(price.price))
          })) || []
        }

        // Solo incluir ID si existe y no es temporal
        if (variant.id && !variant.id.toString().startsWith('temp-')) {
          variantPayload.id = variant.id
        }

        // Only include optional fields if they have values
        if (variant.sku && variant.sku.trim() !== "") {
          variantPayload.sku = variant.sku
        }
        if (variant.imageUrls && variant.imageUrls.length > 0) {
          variantPayload.imageUrls = variant.imageUrls
        }
        if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity !== null) {
          variantPayload.inventoryQuantity = Number(variant.inventoryQuantity)
        }
        if (variant.weightValue !== undefined && variant.weightValue !== null) {
          variantPayload.weightValue = Number(variant.weightValue)
        }
        if (variant.isActive !== undefined) {
          variantPayload.isActive = variant.isActive
        }
        if (variant.position !== undefined && variant.position !== null) {
          variantPayload.position = Number(variant.position)
        }
        if (variant.attributes && Object.keys(variant.attributes).length > 0) {
          variantPayload.attributes = variant.attributes
        }

        return variantPayload
      })
    }

    // Preparar datos originales para comparación
    const originalDataForComparison = {
      title: originalData.title,
      slug: originalData.slug,
      description: originalData.description,
      vendor: originalData.vendor,
      allowBackorder: originalData.allowBackorder,
      releaseDate: originalData.releaseDate,
      status: originalData.status,
      restockThreshold: originalData.restockThreshold,
      restockNotify: originalData.restockNotify,
      categoryIds: originalData.categories?.map((c) => c.id) || [],
      collectionIds: originalData.collections?.map((c) => c.id) || [],
      imageUrls: originalData.imageUrls,
      metaTitle: originalData.metaTitle,
      metaDescription: originalData.metaDescription,
      variants: (originalData.variants || []).map(variant => {
        const variantPayload: Record<string, unknown> = {
          title: variant.title,
          prices: variant.prices?.map(price => ({
            currencyId: price.currencyId,
            price: truncateToTwoDecimals(Number(price.price))
          })) || []
        }

        // Only include optional fields if they have values
        if (variant.sku && variant.sku.trim() !== "") {
          variantPayload.sku = variant.sku
        }
        if (variant.imageUrls && variant.imageUrls.length > 0) {
          variantPayload.imageUrls = variant.imageUrls
        }
        if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity !== null) {
          variantPayload.inventoryQuantity = Number(variant.inventoryQuantity)
        }
        if (variant.weightValue !== undefined && variant.weightValue !== null) {
          variantPayload.weightValue = Number(variant.weightValue)
        }
        if (variant.isActive !== undefined) {
          variantPayload.isActive = variant.isActive
        }
        if (variant.position !== undefined && variant.position !== null) {
          variantPayload.position = Number(variant.position)
        }
        if (variant.attributes && Object.keys(variant.attributes).length > 0) {
          variantPayload.attributes = variant.attributes
        }

        return variantPayload
      })
    }

    // Obtener solo los campos que han cambiado
    const changes = getChangedFields(originalDataForComparison, currentData)
    
    // Filtrar valores vacíos del resultado
    return filterEmptyValues(changes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No store selected. Please select a store first.",
      })
      return
    }

    // Validación eliminada

    setIsSaving(true)
    try {
      // Generate the exact payload that will be sent to the backend
      const payload = generatePayload()

      // Print the exact payload being sent to console
      console.log(`=== PAYLOAD ENVIADO AL BACKEND (QUICK EDIT) ===`)
      console.log(`Campos enviados: ${Object.keys(payload).join(', ')}`)
      console.log(JSON.stringify(payload, null, 2))
      console.log("==================================================")

      // Send update request
      await updateProduct(product.id, payload)

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
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col p-2 sm:p-6">
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <DialogTitle className="text-lg sm:text-xl">Edición Rápida de Producto</DialogTitle>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/products/${product.id}/edit`, "_blank")}>
              <Settings className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Edición Completa</span>
              <span className="sm:hidden">Completa</span>
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-grow overflow-hidden p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6 animate-pulse">
              {/* Skeleton para Información General */}
              <div className="space-y-4">
                <div className="h-6 w-40 bg-muted rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton para Variantes */}
              <div className="space-y-4">
                <div className="h-6 w-32 bg-muted rounded"></div>
                <div className="border rounded-lg p-3 sm:p-4">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="h-4 w-4 bg-muted rounded"></div>
                        <div className="h-10 flex-1 w-full sm:w-auto bg-muted rounded"></div>
                        <div className="h-10 w-full sm:w-24 bg-muted rounded"></div>
                        <div className="h-10 w-full sm:w-24 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skeleton para Imágenes */}
              <div className="space-y-4">
                <div className="h-6 w-28 bg-muted rounded"></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(80vh-140px)] sm:h-[calc(75vh-120px)] pr-1 sm:pr-2">
              <div className="space-y-4 sm:space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información General</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label htmlFor="title" className="text-sm">Nombre</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} className="h-9 sm:h-10" />
                  </div>
                  <div>
                    <Label htmlFor="slug" className="text-sm">Slug</Label>
                    <div className="relative">
                      <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} className="h-9 sm:h-10" />
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
                              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label htmlFor="vendor" className="text-sm">Proveedor</Label>
                    <Input id="vendor" name="vendor" value={formData.vendor || ""} onChange={handleChange} className="h-9 sm:h-10" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm">Categorías</Label>
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
                    <Label htmlFor="collection" className="text-sm">Colecciones</Label>
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
                
                <VariantsDetailTable
                  variants={formData.variants || []}
                  useVariants={(formData.variants?.length || 0) > 1}
                  shopSettings={shopSettings}
                  formData={formData}
                  onVariantChange={(indexOrId, field, value) => {
                    handleVariantChange(indexOrId, field, value)
                  }}
                  onWeightChange={(indexOrId, value) => {
                    handleWeightChange(indexOrId, value)
                  }}
                  onInventoryChange={(indexOrId, value) => {
                    handleInventoryChange(indexOrId, value)
                  }}
                  onInventoryBlur={(indexOrId, value) => {
                    handleInventoryBlur(indexOrId, value)
                  }}
                  onPriceChange={(indexOrId, currencyId, value) => {
                    const decimalRegex = /^\d*\.?\d{0,2}$/
                    if (decimalRegex.test(value) || value === "") {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        handleVariantPriceChange(String(indexOrId), currencyId, variantHandlers.roundPrice(numValue))
                      }
                    }
                  }}
                  onOriginalPriceChange={(indexOrId, currencyId, value) => {
                    const decimalRegex = /^\d*\.?\d{0,2}$/
                    if (decimalRegex.test(value) || value === "") {
                      const numValue = value === "" ? null : Number(value)
                      if (numValue === null || !isNaN(numValue)) {
                        handleVariantOriginalPriceChange(String(indexOrId), currencyId, numValue ? variantHandlers.roundPrice(numValue) : null)
                      }
                    }
                  }}
                  onImageUpload={(indexOrId) => {
                    handleImageUpload(String(indexOrId))
                  }}
                  onImageRemove={(indexOrId, imageIndex) => {
                    handleRemoveImage(String(indexOrId), imageIndex)
                  }}
                  onProductImageRemove={(imageIndex: number) => {
                    setFormData((prev) => ({ 
                      ...prev, 
                      imageUrls: prev.imageUrls!.filter((_, i) => i !== imageIndex) 
                    }))
                  }}
                  mode="edit"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-0">
            <div className="flex-1 text-xs text-muted-foreground order-2 sm:order-1">
              <span className="hidden sm:inline">Presiona </span>
              <kbd className="px-1 py-0.5 bg-muted rounded border">Ctrl</kbd> +{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded border">S</kbd> 
              <span className="hidden sm:inline"> para guardar</span>
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isSaving} className="flex-1 sm:flex-none">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="sm:hidden">Guardando</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Guardar cambios</span>
                    <span className="sm:hidden">Guardar</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}