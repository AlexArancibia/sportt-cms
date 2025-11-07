"use client"

import { useState, useEffect, memo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useMainStore } from "@/stores/mainStore"
import type { Product, ProductSearchParams, PaginatedProductsResponse } from "@/types/product"

interface ProductSelection {
  productId: string
  variantId: string | null
  product: Product // Añadir el producto completo para evitar dependencias externas
}

interface ProductSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCurrency: string
  onConfirm: (selections: ProductSelection[]) => void
  currentLineItems: ProductSelection[]
}

/**
 * ProductSelectionDialog - Componente completamente independiente para selección de productos
 * 
 * Características principales:
 * - Fetch independiente con paginación server-side
 * - Búsqueda con debounce (300ms)
 * - Selección múltiple de variantes por producto
 * - Validación automática de selecciones
 * - Expansión de descripciones con click
 * - Solo productos activos (status: 'ACTIVE')
 * 
 * Comportamiento de fetch:
 * 1. Fetch inicial: Solo cuando se abre el diálogo (página 1)
 * 2. Fetch por búsqueda: Solo cuando cambia el término de búsqueda (página 1)
 * 3. Fetch por paginación: Solo cuando se cambia de página manualmente
 * 
 * Lógica de selección:
 * - Productos con 1 variante: Selección automática de la variante
 * - Productos con múltiples variantes: Selección manual obligatoria
 * - Deselección de única variante: Deselecciona todo el producto
 */
export const ProductSelectionDialog = memo(function ProductSelectionDialog({
  open,
  onOpenChange,
  selectedCurrency,
  onConfirm,
  currentLineItems,
}: ProductSelectionDialogProps) {
  const { currentStore, fetchProductsByStore } = useMainStore()
  
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([])
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Constantes
  const PRODUCTS_PER_PAGE = 10
  const SEARCH_DEBOUNCE_MS = 300

  // Función helper para resetear estado
  const resetState = useCallback(() => {
    setSelectedProducts([])
    setSelectedVariants({})
    setCurrentPage(1)
    setSearchTerm("")
    setProducts([])
    setExpandedDescriptions(new Set())
  }, [])

  // Función helper para limpiar HTML de las descripciones
  const cleanHtmlDescription = useCallback((html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim()
  }, [])

  // Funciones para manejar expansión de descripciones con click
  const toggleDescriptionExpansion = useCallback((productId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      newSet.has(productId) ? newSet.delete(productId) : newSet.add(productId)
      return newSet
    })
  }, [])

  const isDescriptionExpanded = useCallback((productId: string): boolean => {
    return expandedDescriptions.has(productId)
  }, [expandedDescriptions])



  // Función para cargar productos con paginación - independiente de datos pre-cargados
  const loadProducts = useCallback(async (page: number = 1, search: string = "") => {
    if (!currentStore) {
      return
    }

    setIsLoading(true)
    try {
       const searchParams: ProductSearchParams = {
         page,
         limit: PRODUCTS_PER_PAGE,
         sortBy: 'createdAt',
         sortOrder: 'desc',
         status: ['ACTIVE'],
         ...(search && { query: search })
       }

      const response: PaginatedProductsResponse = await fetchProductsByStore(currentStore, searchParams)
      
      setProducts(response.data)
      setTotalPages(response.pagination.totalPages)
      setTotalProducts(response.pagination.total)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error loading products:", error)
      setProducts([])
      setTotalPages(1)
      setTotalProducts(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentStore, fetchProductsByStore, PRODUCTS_PER_PAGE])

  // Efecto optimizado para cargar productos al abrir el diálogo
  useEffect(() => {
    if (open) {
      resetState()
      loadProducts(1)
    }
  }, [open, loadProducts, resetState])

  // Efecto para búsqueda - solo cuando cambia el término de búsqueda
  useEffect(() => {
    if (!open || !searchTerm) return

     const debounceTimeout = setTimeout(() => {
       loadProducts(1, searchTerm)
     }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, open, loadProducts])

  // Función optimizada para cambiar de página
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadProducts(newPage, searchTerm)
    }
  }, [totalPages, loadProducts, searchTerm])

  // Funciones helper para manejo de estado
  const addProductSelection = useCallback((productId: string, variantId: string, product: Product) => {
    setSelectedProducts(prev => [...prev, { productId, variantId, product }])
  }, [])

  const removeProductSelection = useCallback((productId: string, variantId?: string) => {
    setSelectedProducts(prev => 
      variantId 
        ? prev.filter(item => !(item.productId === productId && item.variantId === variantId))
        : prev.filter(item => item.productId !== productId)
    )
  }, [])

  const updateSelectedVariants = useCallback((productId: string, variants: string[]) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variants,
    }))
  }, [])

  const removeProductVariants = useCallback((productId: string) => {
    setSelectedVariants(prev => {
      const { [productId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const handleProductToggle = useCallback((productId: string, checked: boolean) => {
    if (checked) {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      // Solo auto-seleccionar si el producto tiene exactamente 1 variante
      if (product.variants.length === 1) {
        const variantId = product.variants[0].id
        updateSelectedVariants(productId, [variantId])
        addProductSelection(productId, variantId, product)
      } else if (product.variants.length > 1) {
        // Para productos con múltiples variantes, solo marcar como seleccionado
        updateSelectedVariants(productId, [])
      }
    } else {
      // Remover todas las variantes del producto
      removeProductSelection(productId)
      removeProductVariants(productId)
    }
  }, [products, addProductSelection, removeProductSelection, updateSelectedVariants, removeProductVariants])

  // Función para manejar el toggle de variantes individuales
  const handleVariantToggle = useCallback((productId: string, variantId: string, checked: boolean) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (checked) {
      // Agregar variante
      const currentVariants = selectedVariants[productId] || []
      updateSelectedVariants(productId, [...currentVariants, variantId])
      addProductSelection(productId, variantId, product)
    } else {
      // Remover variante
      const newSelectedVariants = (selectedVariants[productId] || []).filter(id => id !== variantId)
      
      // Si el producto tiene una sola variante y se deselecciona, deseleccionar todo el producto
      if (product.variants.length === 1 && newSelectedVariants.length === 0) {
        removeProductSelection(productId)
        removeProductVariants(productId)
      } else {
        // Solo remover la variante específica
        updateSelectedVariants(productId, newSelectedVariants)
        removeProductSelection(productId, variantId)
      }
    }
  }, [products, selectedVariants, addProductSelection, removeProductSelection, updateSelectedVariants, removeProductVariants])

  // Función para verificar si una variante está seleccionada
  const isVariantSelected = useCallback((productId: string, variantId: string): boolean => {
    return selectedVariants[productId]?.includes(variantId) || false
  }, [selectedVariants])

  // Función para validar que todos los productos seleccionados tengan al menos una variante
  const isValidSelection = useCallback((): boolean => {
    return Object.keys(selectedVariants).every(productId => {
      const selectedVariantsForProduct = selectedVariants[productId] || []
      return selectedVariantsForProduct.length > 0
    })
  }, [selectedVariants])

  // Función para obtener el texto del botón de confirmar
  const getConfirmButtonText = useCallback((): string => {
    const totalSelections = selectedProducts.length
    if (totalSelections === 0) return "Confirmar (0)"
    
    const hasInvalidProducts = !isValidSelection()
    return hasInvalidProducts 
      ? `Confirmar (${totalSelections}) - Selecciona variantes`
      : `Confirmar (${totalSelections})`
  }, [selectedProducts.length, isValidSelection])

  // Función helper para obtener el precio de una variante
  const getVariantPrice = useCallback((variant: any): string => {
    if (!selectedCurrency) return ""

    const price = variant.prices.find((p: any) => p.currencyId === selectedCurrency)
    if (!price) return ""

    const rawPrice = price.price
    const numericPrice = typeof rawPrice === "number" ? rawPrice : Number(rawPrice)

    if (!Number.isFinite(numericPrice)) return ""

    return ` - ${numericPrice.toFixed(2)}`
  }, [selectedCurrency])

  const handleConfirm = useCallback(() => {
    onConfirm(selectedProducts)
    onOpenChange(false)
  }, [selectedProducts, onConfirm, onOpenChange])

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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando productos...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {products.length > 0 ? (
                products.map((product) => {
                const isSelected = selectedVariants.hasOwnProperty(product.id)
                const selectedVariantsForProduct = selectedVariants[product.id] || []

                return (
                  <div key={product.id} className="border rounded-md p-4 group">
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
                          <p 
                            className={`text-sm text-muted-foreground mt-1 select-none transition-all duration-300 cursor-pointer ${
                              isDescriptionExpanded(product.id) 
                                ? 'line-clamp-none bg-muted/20 py-2 rounded-md shadow-sm' 
                                : 'line-clamp-2'
                            }`}
                            onClick={() => toggleDescriptionExpansion(product.id)}
                          >
                            {cleanHtmlDescription(product.description)}
                          </p>
                        )}

                        {isSelected && product.variants.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Label className="text-sm">
                                Seleccionar variantes:
                              </Label>
                              {product.variants.length > 1 && selectedVariantsForProduct.length === 0 && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                  ⚠️ Debes seleccionar al menos una variante
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {product.variants.map((variant) => (
                                <div key={variant.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`variant-${variant.id}`}
                                    checked={isVariantSelected(product.id, variant.id)}
                                    onCheckedChange={(checked) => 
                                      handleVariantToggle(product.id, variant.id, checked as boolean)
                                    }
                                  />
                                   <Label 
                                     htmlFor={`variant-${variant.id}`}
                                     className="text-sm font-normal cursor-pointer"
                                   >
                                     {variant.title || product.title}{getVariantPrice(variant)}
                                   </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? `No se encontraron productos para "${searchTerm}"` : "No hay productos disponibles"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles de paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 border-t">
             <div className="text-sm text-muted-foreground">
               Mostrando {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1} a {Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)} de {totalProducts} productos
             </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber: number
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedProducts.length === 0 || !isValidSelection()}>
            {getConfirmButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
