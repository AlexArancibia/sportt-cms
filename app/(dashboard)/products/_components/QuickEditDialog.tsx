"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { useCategories } from "@/hooks/useCategories"
import { useCollections } from "@/hooks/useCollections"
import { useProductById } from "@/hooks/useProductById"
import { useUpdateProduct } from "@/hooks/useUpdateProduct"
import { ScrollArea } from "@/components/ui/scroll-area"
import { slugify } from "@/lib/slugify"
import {
  filterEmptyValues,
  getChangedFields,
  cleanVariantForPayload,
  prepareVariantForComparison,
  getAcceptedCurrencies,
} from "@/lib/productPayloadUtils"
import { Save, Loader2, RefreshCw, Info, Settings, X } from 'lucide-react'
import type { Category } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { ProductVariant } from "@/types/productVariant"
import type { Product } from "@/types/product"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getApiErrorMessage } from "@/lib/errorHelpers"

interface QuickEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  /** Called when dialog closes; `saved` is true only when user saved successfully. */
  onClose?: (saved: boolean) => void
  /** Lista de proveedores (marcas) de la página de productos, para que el desplegable use los mismos datos que el filtro Marca. */
  vendors?: string[]
  /** true mientras se cargan los proveedores en la página. */
  isLoadingVendors?: boolean
}

export function QuickEditDialog({ open, onOpenChange, product, onClose, vendors = [], isLoadingVendors = false }: QuickEditDialogProps) {
  const { currentStoreId } = useStores()
  const currentStore = currentStoreId
  const { toast } = useToast()
  
  // React Query hooks para datos necesarios
  const { data: currencies = [] } = useCurrencies()
  const { data: currentShopSettings } = useShopSettings(currentStore)
  const shopSettings = currentShopSettings ? [currentShopSettings] : []
  const { data: exchangeRates = [] } = useExchangeRates()
  const [formData, setFormData] = useState<Product>(product)
  const [originalData, setOriginalData] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true) // mantiene UX actual del skeleton
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
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
  

  // Producto fresco (React Query)
  const {
    data: freshProduct,
    error: productError,
    isFetching: isFetchingProduct,
  } = useProductById(currentStore, open ? product.id : null, open && !!currentStore)

  // Mantener UX anterior del skeleton usando estado local
  useEffect(() => {
    if (!open) return
    setIsLoading(isFetchingProduct)
  }, [open, isFetchingProduct])

  // Aplicar producto fresco cuando llegue; fallback al prop si falla (mismo comportamiento)
  useEffect(() => {
    if (!open) return

    if (freshProduct) {
      setFormData(freshProduct)
      setOriginalData(freshProduct)
      return
    }

    if (productError) {
      setFormData(product)
      setOriginalData(product)
    }
  }, [open, freshProduct, productError, product])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && open) {
        e.preventDefault()
        formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }

      // Close on Escape (or show unsaved confirm)
      if (e.key === "Escape" && open) {
        e.preventDefault()
        requestCloseRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Load categories and collections when dialog opens (React Query)
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: isLoadingCategories,
  } = useCategories(currentStore, { limit: 50 }, open && !!currentStore)

  const {
    data: collectionsData,
    error: collectionsError,
    isLoading: isLoadingCollections,
  } = useCollections(currentStore, open && !!currentStore)

  // Opciones del desplegable: Ninguno + lista de la página. Si el producto tiene un vendor que no está en la lista, lo incluimos para mostrar el dato original.
  const vendorOptions = useMemo(() => {
    const fromList = vendors || []
    const current = formData.vendor?.trim()
    if (!current || fromList.includes(current)) return fromList
    return [current, ...fromList]
  }, [vendors, formData.vendor])

  const categories = categoriesData?.data ?? []
  const collections = collectionsData ?? []

  const updateProductMutation = useUpdateProduct(currentStore)

  useEffect(() => {
    if (!open) return
    if (categoriesError || collectionsError) {
      toast({
        title: "Error",
        description: "Error al cargar los datos. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    }
  }, [open, categoriesError, collectionsError, toast])

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
    variantHandlers.handlePriceChange(variantId, currencyId, value, exchangeRates, shopSettings)
  }

  // Handler de precio original con conversión automática
  const handleVariantOriginalPriceChange = (variantId: string, currencyId: string, originalPrice: number | null) => {
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

  // Función para generar el payload que se enviará al backend
  const generatePayload = (): Record<string, unknown> => {
    if (!originalData) {
      throw new Error("Original data not available for comparison")
    }

    // Obtener monedas aceptadas de shopSettings
    const acceptedCurrencies = getAcceptedCurrencies(shopSettings)
    const fallbackCurrencies = currencies || null
    
    // Preparar datos actuales para comparación
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
      variants: (formData.variants || []).map(variant => 
        prepareVariantForComparison(variant, acceptedCurrencies, fallbackCurrencies)
      ),
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
      variants: (originalData.variants || []).map(variant => 
        prepareVariantForComparison(variant, acceptedCurrencies, fallbackCurrencies)
      ),
    }

    // Obtener solo los campos que han cambiado
    const changes = getChangedFields(originalDataForComparison, currentData)
    
    // Si hay cambios en variants, reconstruir el payload usando cleanVariantForPayload
    if (changes.variants) {
      const currentVariants = formData.variants || []
      const isSimpleProduct = currentVariants.length === 1 && 
        (!currentVariants[0].attributes || 
         Object.keys(currentVariants[0].attributes).length === 0 ||
         currentVariants[0].attributes.type === "simple")
      
      changes.variants = currentVariants.map(variant => 
        cleanVariantForPayload(variant, {
          totalVariants: currentVariants.length,
          isSimpleProduct,
          acceptedCurrencies,
          fallbackCurrencies,
        })
      )
    }
    
    // Filtrar valores vacíos del resultado
    return filterEmptyValues(changes)
  }

  /** True if form has changes compared to original (for unsaved-changes confirmation). */
  const hasUnsavedChanges = (): boolean => {
    if (!originalData) return false
    
    // Obtener monedas aceptadas de shopSettings
    const acceptedCurrencies = getAcceptedCurrencies(shopSettings)
    const fallbackCurrencies = currencies || null
    
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
      variants: (formData.variants || []).map(variant => 
        prepareVariantForComparison(variant, acceptedCurrencies, fallbackCurrencies)
      ),
    }
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
      variants: (originalData.variants || []).map(variant => 
        prepareVariantForComparison(variant, acceptedCurrencies, fallbackCurrencies)
      ),
    }
    const changes = getChangedFields(originalDataForComparison, currentData)
    return Object.keys(changes).length > 0
  }

  const doClose = useCallback((saved: boolean) => {
    setShowConfirmClose(false)
    onOpenChange(false)
    onClose?.(saved)
  }, [onOpenChange, onClose])

  const requestClose = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmClose(true)
    } else {
      doClose(false)
    }
  }

  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

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

    // Validar que al menos una variante esté activa
    // EXCEPCIÓN: Si hay 1 variante inactiva, el payload la activará automáticamente (generatePayload fuerza isActive: true)
    const currentVariants = formData.variants || []
    const isSingleVariant = currentVariants.length === 1
    const singleVariantIsInactive = isSingleVariant && currentVariants[0]?.isActive === false
    const isActivatingSingleVariant = isSingleVariant && singleVariantIsInactive && 
      originalData?.variants?.[0]?.isActive === false

    const hasActiveVariant = currentVariants.some(v => v.isActive !== false)
    
    // Bloquear solo si no hay variantes activas Y no se está activando la única variante
    if (!hasActiveVariant && !isActivatingSingleVariant) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El producto debe tener al menos una variante activa.",
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = generatePayload()
      await updateProductMutation.mutateAsync({ productId: product.id, payload })

      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })
      doClose(true)
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(
        error,
        "Error al actualizar el producto. Por favor, inténtelo de nuevo."
      )
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
    <>
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) onOpenChange(true)
        else requestCloseRef.current()
      }}
    >
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col p-2 sm:p-6 gap-0">
        {/* Close button (X) - top right */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10"
          onClick={requestClose}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </Button>

        <DialogHeader className="flex flex-col gap-3 pr-10 sm:pr-10">
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <DialogTitle className="text-lg sm:text-xl shrink-0">Edición Rápida de Producto</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              {!isLoading && (
                <>
                  <div className="flex items-center gap-2 shrink-0">
                    {formData.status === ProductStatus.ARCHIVED ? (
                      <>
                        <Switch checked={false} disabled />
                        <Badge className="bg-orange-500 hover:bg-orange-500">Archivado</Badge>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(`/products/${product.id}/edit`, "_blank")}>
                    <Settings className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edición Completa</span>
                    <span className="sm:hidden">Completa</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="space-y-4 sm:space-y-6 animate-pulse px-3 sm:px-4 py-4">
              {/* Skeleton para Información General */}
              <div className="space-y-4">
                <div className="h-6 w-48 bg-muted rounded"></div>
                
                {/* Fila 1: Nombre | Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-12 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>

                {/* Fila 2: Proveedor | Categorías | Colecciones */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>

                {/* Checkbox: Permitir pedidos pendientes */}
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-56 bg-muted rounded"></div>
                    <div className="h-3 w-full max-w-md bg-muted rounded"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton para Variantes */}
              <div className="space-y-4 pt-4 border-t">
                <div className="h-6 w-56 bg-muted rounded"></div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-2">
                    <div className="h-4 w-full bg-muted rounded"></div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-1 sm:pr-2">
              <div className="space-y-4 sm:space-y-6 px-3 sm:px-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <Label htmlFor="vendor" className="text-sm">Proveedor</Label>
                    <Select
                      value={formData.vendor || "__none__"}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, vendor: value === "__none__" ? "" : value }))}
                      disabled={isLoadingVendors}
                    >
                      <SelectTrigger className="min-h-[40px] w-full">
                        <SelectValue placeholder={isLoadingVendors ? "Cargando..." : "Selecciona..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        {vendorOptions.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      className="min-h-[40px]"
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
                      className="min-h-[40px]"
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
              <Button type="button" variant="outline" onClick={requestClose} disabled={isSaving} className="flex-1 sm:flex-none min-h-9">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isSaving} className="flex-1 sm:flex-none min-h-9">
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

    <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
          <AlertDialogDescription>
            Hay cambios sin guardar. ¿Cerrar de todos modos? Se perderán los cambios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir editando</AlertDialogCancel>
          <AlertDialogAction onClick={() => doClose(false)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Cerrar sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}