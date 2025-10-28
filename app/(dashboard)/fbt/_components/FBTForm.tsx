"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import { Search, Package, Filter } from "lucide-react"
import Image from "next/image"
import type { ProductVariant } from "@/types/productVariant"
import type { FrequentlyBoughtTogether } from "@/types/fbt"

interface FBTFormProps {
  mode: "create" | "edit"
  initialData?: FrequentlyBoughtTogether | null
  onSubmit: (data: {
    name: string
    discountName?: string
    discount?: number
    variantIds: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function FBTForm({ mode, initialData, onSubmit, onCancel, isLoading = false }: FBTFormProps) {
  const { currentStore, fetchProductsByStore } = useMainStore()
  const { toast } = useToast()

  const [name, setName] = useState(initialData?.name || "")
  const [discountName, setDiscountName] = useState(initialData?.discountName || "")
  const [discount, setDiscount] = useState(initialData?.discount?.toString() || "")
  const [selectedVariants, setSelectedVariants] = useState<string[]>(initialData?.variants?.map((v) => v.id) || [])
  const [products, setProducts] = useState<any[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const loadProducts = async () => {
      // Restaurar currentStore desde localStorage si no existe
      let storeId = currentStore
      
      if (!storeId && typeof window !== "undefined") {
        storeId = localStorage.getItem("currentStoreId")
        if (storeId) {
          useMainStore.getState().setCurrentStore(storeId)
        }
      }
      
      if (!storeId) return

      try {
        setIsLoadingData(true)
        // Fetch con límite alto para obtener todos los productos disponibles
        const response = await fetchProductsByStore(storeId, { limit: 100 })
        const productsData = response.data
        setProducts(productsData)

        // Extract all variants from loaded products
        const allVariants: ProductVariant[] = []
        productsData.forEach((product) => {
          if (product.variants && product.variants.length > 0) {
            allVariants.push(...product.variants)
          }
        })

        setVariants(allVariants)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los productos",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadProducts()
  }, [currentStore, fetchProductsByStore, toast])

  // Update state when initial data changes (useful for edit)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDiscountName(initialData.discountName || "")
      setDiscount(initialData.discount?.toString() || "")
      setSelectedVariants(initialData.variants?.map((v) => v.id) || [])
    }
  }, [initialData])

  const getProductForVariant = (variantId: string) => {
    return (
      products.find((product) => product.variants?.some((variant: { id: string }) => variant.id === variantId)) || null
    )
  }

  // Filter variants based on search term and filters
  const filteredVariants = useMemo(() => {
    let filtered = variants

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((variant) => {
        const product = getProductForVariant(variant.id)
        if (!product) return false

        const searchLower = searchTerm.toLowerCase()
        return (
          product.title.toLowerCase().includes(searchLower) ||
          variant.title?.toLowerCase().includes(searchLower) ||
          variant.sku?.toLowerCase().includes(searchLower))
      })
    }

    // Filter only selected if enabled
    if (showOnlySelected) {
      filtered = filtered.filter((variant) => selectedVariants.includes(variant.id))
    }

    // Sort to show selected items first
    filtered.sort((a, b) => {
      const aSelected = selectedVariants.includes(a.id)
      const bSelected = selectedVariants.includes(b.id)
      
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })

    return filtered
  }, [variants, searchTerm, showOnlySelected, selectedVariants, products])

  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVariants = filteredVariants.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showOnlySelected])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del combo es obligatorio",
      })
      return
    }

    if (selectedVariants.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos 2 productos para el combo",
      })
      return
    }

    try {
      await onSubmit({
        name,
        discountName: discountName || undefined,
        discount: discount ? Number.parseFloat(discount) : undefined,
        variantIds: selectedVariants,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo ${mode === "create" ? "crear" : "actualizar"} el combo`,
      })
    }
  }

  const handleVariantToggle = (variantId: string) => {
    setSelectedVariants((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId],
    )
  }

  const getVariantImage = (variant: ProductVariant) => {
    // First try to use variant image
    if (variant.imageUrls && variant.imageUrls.length > 0) {
      return variant.imageUrls[0]
    }

    // If no variant image, use product image
    const product = getProductForVariant(variant.id)
    if (product?.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0]
    }

    return null
  }

  const clearFilters = () => {
    setSearchTerm("")
    setShowOnlySelected(false)
  }

  const isFormLoading = isLoading || isLoadingData

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información del Combo</CardTitle>
          <CardDescription>Configura los detalles básicos del combo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Combo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Combo Desayuno Completo"
                required
                disabled={isFormLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountName">Nombre del Descuento (opcional)</Label>
              <Input
                id="discountName"
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                placeholder="Ej: Descuento Especial"
                disabled={isFormLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Descuento % (opcional)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Ej: 10"
                disabled={isFormLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selección de Productos
          </CardTitle>
          <CardDescription>Selecciona los productos que formarán parte del combo (mínimo 2)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and search */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar productos por nombre, variante o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isFormLoading}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnlySelected"
                    checked={showOnlySelected}
                    onCheckedChange={(checked) => setShowOnlySelected(checked === true)}
                    disabled={isFormLoading}
                  />
                  <Label htmlFor="showOnlySelected" className="text-sm font-medium cursor-pointer">
                    Solo seleccionados
                  </Label>
                </div>
                {(searchTerm || showOnlySelected) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Results counter */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isLoadingData ? "Cargando..." : `${filteredVariants.length} productos encontrados`}
                {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
              </span>
              {selectedVariants.length > 0 && (
                <span className="font-medium text-primary">{selectedVariants.length} seleccionados</span>
              )}
            </div>
          </div>

          {isLoadingData ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-2 border rounded-md animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded mr-3" />
                  <div className="w-12 h-12 bg-muted rounded-md mr-3" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-3.5 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="text-center py-8">
              {variants.length === 0 ? (
                <div className="space-y-2">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-medium">No hay productos disponibles</p>
                  <p className="text-sm text-muted-foreground">Crea productos primero para poder crear combos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-medium">No se encontraron productos</p>
                  <p className="text-sm text-muted-foreground">
                    Intenta con otros términos de búsqueda o limpia los filtros.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {paginatedVariants.map((variant) => {
                const product = getProductForVariant(variant.id)
                const variantImage = getVariantImage(variant)
                if (!product) return null

                return (
                  <div
                    key={variant.id}
                    className={`flex items-center p-2 border rounded-md hover:bg-muted/50 transition-colors ${
                      selectedVariants.includes(variant.id) ? "border-border bg-primary/5" : ""
                    }`}
                  >
                    <Checkbox
                      id={variant.id}
                      checked={selectedVariants.includes(variant.id)}
                      onCheckedChange={() => handleVariantToggle(variant.id)}
                      className="mr-3"
                      disabled={isFormLoading}
                    />

                    {/* Product/variant image */}
                    <div className="w-12 h-12 mr-3 flex-shrink-0">
                      {variantImage ? (
                        <Image
                          src={variantImage || "/placeholder.svg"}
                          alt={`${product.title} - ${variant.title || "Variante principal"}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-md border"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-md border flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={variant.id} className="font-medium cursor-pointer text-sm truncate">
                          {product.title}
                        </Label>
                        {variant.prices && variant.prices[0] && (
                          <div className="text-sm font-medium ml-2 flex-shrink-0">
                            {variant.prices[0].originalPrice && variant.prices[0].originalPrice > variant.prices[0].price ? (
                              <div className="flex flex-col items-start">
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(variant.prices[0].originalPrice, variant.prices[0].currency?.code || "USD")}
                                </span>
                                <span className="text-sm font-medium text-red-600">
                                  {formatCurrency(variant.prices[0].price, variant.prices[0].currency?.code || "USD")}
                                </span>
                              </div>
                            ) : (
                              formatCurrency(variant.prices[0].price, variant.prices[0].currency?.code || "USD")
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate">{variant.title || "Variante principal"}</span>
                        {variant.sku && (
                          <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0">
                            {variant.sku}
                          </span>
                        )}
                        {variant.inventoryQuantity !== undefined && (
                          <span className="flex-shrink-0">Stock: {variant.inventoryQuantity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredVariants.length)} de {filteredVariants.length} productos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        type="button"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {selectedVariants.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Productos seleccionados: {selectedVariants.length}</p>
                  {selectedVariants.length < 2 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Selecciona al menos 2 productos para crear un combo
                    </p>
                  )}
                </div>
                {selectedVariants.length >= 2 && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Listo para crear combo</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isFormLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isFormLoading || selectedVariants.length < 2 || !name}>
            {mode === "create" ? "Crear Combo" : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}