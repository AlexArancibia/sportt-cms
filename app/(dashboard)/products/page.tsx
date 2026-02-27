"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useProducts } from "@/hooks/useProducts"
import { useVendors } from "@/hooks/useVendors"
import { useCategorySlugs } from "@/hooks/useCategorySlugs"
import { useCollections } from "@/hooks/useCollections"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useProductMutations } from "@/hooks/useProductMutations"
import { useCurrencies } from "@/hooks/useCurrencies"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Loader2, Package, Check, X, Download, FileDown, Filter, Tag, Building2, XCircle, Archive, RotateCcw } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/types/product"
import { HeaderBar } from "@/components/HeaderBar"
import { getImageUrl } from "@/lib/imageUtils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QuickEditDialog } from "./_components/QuickEditDialog"
import { formatPrice } from "@/lib/utils"
import { ProductStatus } from "@/types/common"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportPDFDialog } from "./_components/ExportPDFDialog"
import { useProductPDFExport } from "./_hooks/useProductPDFExport"
import { ExportCSVDialog } from "./_components/ExportCSVDialog"
import { useProductCSVExport } from "./_hooks/useProductCSVExport"
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

const DELETE_BLOCKED_HINT = "Variantes con órdenes"
const DELETE_BLOCKED_MARKER = "Variantes con órdenes:"
const SKELETON_ROW_COUNT = 5
const MOBILE_SKELETON_COUNT = 3

function extractDeleteBlockedItems(rawMessage: string): string[] {
  const idx = rawMessage.indexOf(DELETE_BLOCKED_MARKER)
  const detailsRaw = idx >= 0 ? rawMessage.slice(idx + DELETE_BLOCKED_MARKER.length).trim() : ""
  if (!detailsRaw) return []

  // El backend manda algo tipo: "Variantes con órdenes: \"SKU\" - \"Título\", \"SKU2\" - \"Título2\""
  return detailsRaw
    .split(/,\s*(?=")/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentStoreId, setCurrentStore } = useStores()
  const currentStore = currentStoreId
  const { toast } = useToast()
  
  // PDF Export hook
  const { isDialogOpen, isExporting, openDialog, closeDialog, handleGeneratePDF, getCurrentShopSettings } = useProductPDFExport()
  
  // CSV Export hook
  const { 
    isDialogOpen: isCSVDialogOpen, 
    isExporting: isCSVExporting, 
    openDialog: openCSVDialog, 
    closeDialog: closeCSVDialog, 
    handleExport: handleCSVExport 
  } = useProductCSVExport()
  
  // Leer parámetros de URL
  const pageFromUrl = searchParams.get('page')
  const queryFromUrl = searchParams.get('q')
  const vendorFromUrl = searchParams.get('vendor')?.split(',').filter(Boolean) || []
  const categoryFromUrl = searchParams.get('category')?.split(',').filter(Boolean) || []
  const includeArchivedFromUrl = (searchParams.get('status') || '').toLowerCase() === 'all'
  
  const [searchTerm, setSearchTerm] = useState(queryFromUrl || "")
  const [selectedVendors, setSelectedVendors] = useState<string[]>(vendorFromUrl)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryFromUrl)
  const [currentPage, setCurrentPage] = useState(pageFromUrl ? parseInt(pageFromUrl) : 1)
  const [includeArchived, setIncludeArchived] = useState(includeArchivedFromUrl)
  const [pageInput, setPageInput] = useState("") // Estado para el input de página
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false) // Loading para acciones (delete, archive, etc.)
  const productsPerPage = 20
  
  // Estado para debounce de búsqueda
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  
  // Effect para debounce de searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, searchTerm ? 300 : 0)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  // Reset página a 1 solo cuando cambian los filtros (no cuando el usuario cambia de página)
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedVendors.length, selectedCategories.length, includeArchived])
  
  // Hook de React Query para productos
  const {
    data: productsData,
    isLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts(
    currentStore,
    {
      page: currentPage,
      limit: productsPerPage,
      query: debouncedSearchTerm || undefined,
      vendor: selectedVendors.length > 0 ? selectedVendors : undefined,
      categorySlugs: selectedCategories.length > 0 ? selectedCategories : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: includeArchived ? ['all'] : undefined,
    },
    !!currentStore
  )
  
  // Extraer productos y paginación de la respuesta
  const products = productsData?.data || []
  const productsPagination = productsData?.pagination || null
  
  // Hook de React Query para vendors
  const {
    data: vendors = [],
    isLoading: isLoadingVendors,
    error: vendorsError,
  } = useVendors(currentStore, !!currentStore)

  // Hook de React Query para categorías (slug + name) del filtro
  const {
    data: categoryList = [],
    isLoading: isLoadingCategories,
    error: categorySlugsError,
  } = useCategorySlugs(currentStore, !!currentStore)

  // Hook de React Query para colecciones (precarga para formularios/export)
  const { error: collectionsError } = useCollections(currentStore, !!currentStore)

  // Nota: useCategories se carga bajo demanda cuando se abren formularios/export (no precargar aquí)

  // Hook de React Query para shop settings (mantener shape actual: array con 0..1 item)
  const {
    data: currentShopSettings,
    error: shopSettingsError,
  } = useShopSettings(currentStore)
  const shopSettings = currentShopSettings ? [currentShopSettings] : []

  // Currencies (React Query) - mantener fallback usado en el UI
  const { data: currencies = [] } = useCurrencies()

  // Mutations (React Query) para eliminar/archivar/desarchivar
  const {
    deleteProduct: deleteProductMutation,
    archiveProduct: archiveProductMutation,
    unarchiveProduct: unarchiveProductMutation,
  } = useProductMutations(currentStore)

  // Mostrar toast solo para error de productos (React Query ya registra errores)
  useEffect(() => {
    if (productsError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar productos.",
      })
    }
  }, [productsError, toast])

  type ConfirmActionType = "delete" | "bulkDelete" | "archive" | "unarchive"
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    type: ConfirmActionType | null
    product: Product | null
    productIds: string[]
  }>({
    open: false,
    type: null,
    product: null,
    productIds: [],
  })

  const showDeleteBlockedToast = (rawMessage: string) => {
    const items = extractDeleteBlockedItems(rawMessage)

    toast({
      variant: "destructive",
      title: "No se puede eliminar",
      description: items.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm">Este producto tiene variantes con órdenes asociadas:</div>
          <ul className="list-disc pl-4 space-y-1">
            {items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="text-xs opacity-80">Sugerencia: archívalo en lugar de eliminarlo.</div>
        </div>
      ) : (
        rawMessage
      ),
    })
  }

  // Sincronizar el input de página con la página actual
  useEffect(() => {
    setPageInput(currentPage.toString())
  }, [currentPage])

  // Actualizar URL cuando cambian los parámetros
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString())
    }
    
    if (searchTerm) {
      params.set('q', searchTerm)
    }
    
    if (selectedVendors.length > 0) {
      params.set('vendor', selectedVendors.join(','))
    }
    
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','))
    }

    if (includeArchived) {
      params.set('status', 'all')
    }
    
    const queryString = params.toString()
    const newUrl = queryString ? `/products?${queryString}` : '/products'
    
    // Solo actualizar si la URL es diferente
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [currentPage, searchTerm, selectedVendors, selectedCategories, includeArchived, router])

  const openConfirmDelete = (product: Product) => {
    setConfirmAction({ open: true, type: "delete", product, productIds: [product.id] })
  }

  const openConfirmBulkDelete = () => {
    if (selectedProducts.length === 0) return
    setConfirmAction({ open: true, type: "bulkDelete", product: null, productIds: [...selectedProducts] })
  }

  const openConfirmToggleArchive = (product: Product) => {
    const isArchived = product.status === ProductStatus.ARCHIVED
    setConfirmAction({
      open: true,
      type: isArchived ? "unarchive" : "archive",
      product,
      productIds: [product.id],
    })
  }

  const closeConfirmAction = () => {
    setConfirmAction({ open: false, type: null, product: null, productIds: [] })
  }

  const runConfirmedAction = async () => {
    const { type, product, productIds } = confirmAction
    if (!type) return

    setIsActionLoading(true)
    try {
      switch (type) {
        case "delete": {
          if (!product) return
          await deleteProductMutation.mutateAsync(product.id)
          setSelectedProducts((prev) => prev.filter((id) => id !== product.id))
          toast({ title: "Éxito", description: "Producto eliminado correctamente" })
          break
        }
        case "bulkDelete": {
          for (const productId of productIds) {
            await deleteProductMutation.mutateAsync(productId)
          }
          setSelectedProducts([])
          toast({
            title: "Éxito",
            description: `${productIds.length} productos eliminados correctamente`,
          })
          break
        }
        case "archive": {
          if (!product) return
          await archiveProductMutation.mutateAsync(product.id)
          toast({ title: "Éxito", description: "Producto archivado correctamente" })
          break
        }
        case "unarchive": {
          if (!product) return
          await unarchiveProductMutation.mutateAsync(product.id)
          toast({ title: "Éxito", description: "Producto desarchivado correctamente" })
          break
        }
      }
      // Ya no hace falta refetch manual: las mutaciones invalidan la lista
    } catch (error: unknown) {
      console.error("Error running confirmed action:", error)

      const fallbackByType: Record<ConfirmActionType, string> = {
        delete: "Error al eliminar el producto",
        bulkDelete: "Error al eliminar los productos",
        archive: "Error al archivar el producto",
        unarchive: "Error al desarchivar el producto",
      }

      const message = getApiErrorMessage(error, fallbackByType[type])
      const isDeleteAction = type === "delete" || type === "bulkDelete"

      if (isDeleteAction && message.includes(DELETE_BLOCKED_HINT)) {
        showDeleteBlockedToast(message)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: message,
        })
      }
    } finally {
      setIsActionLoading(false)
      closeConfirmAction()
    }
  }

  const renderArchiveMenuItem = (product: Product) => {
    const isArchived = product.status === ProductStatus.ARCHIVED

    return (
      <DropdownMenuItem onClick={() => openConfirmToggleArchive(product)}>
        {isArchived ? (
          <>
            <RotateCcw className="mr-2 h-4 w-4 text-emerald-600" />
            <span className="text-emerald-600">Desarchivar</span>
          </>
        ) : (
          <>
            <Archive className="mr-2 h-4 w-4 text-orange-500" />
            <span className="text-orange-500">Archivar</span>
          </>
        )}
      </DropdownMenuItem>
    )
  }

  const handleBulkDelete = () => {
    openConfirmBulkDelete()
  }

  const handleQuickEditClose = async (updated: boolean) => {
    setIsQuickEditOpen(false)
    // Ya no hace falta refetch manual: QuickEdit invalida listas/detalle
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((product) => product.id))
    }
  }

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    setSelectedProducts([]) // Clear selection when changing page
  }

  const confirmPageNavigation = () => {
    const page = parseInt(pageInput)
    if (page >= 1 && page <= (productsPagination?.totalPages || 1)) {
      paginate(page)
    } else {
      // Si el input no es válido, restaurar el valor actual
      setPageInput(currentPage.toString())
    }
  }

  const renderPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return "-"

    // Obtener la moneda por defecto de shopSettings
    const defaultCurrency = shopSettings[0]?.defaultCurrency
    const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId
    
    if (!defaultCurrency || !defaultCurrencyId) return "-"

    // Filtrar precios solo de la moneda por defecto
    const variantPrices = product.variants
      .flatMap((variant) => variant.prices || [])
      .filter((price) => price.currencyId === defaultCurrencyId)

    if (variantPrices.length === 0) return "-"

    const prices = variantPrices.map((price) => price.price)
    const originalPrices = variantPrices.map((price) => price.originalPrice).filter(price => price !== null && price !== undefined)

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // Si todos los precios son iguales, mostrar solo un precio
    if (minPrice === maxPrice) {
      const hasOriginalPrice = originalPrices.length > 0
      const originalPrice = hasOriginalPrice ? Math.min(...originalPrices) : null
      
      if (hasOriginalPrice && originalPrice && originalPrice > minPrice) {
        return (
          <div className="flex flex-col items-start">
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice, defaultCurrency)}
            </span>
            <span className="text-sm font-medium text-red-600">
              {formatPrice(minPrice, defaultCurrency)}
            </span>
          </div>
        )
      }
      return formatPrice(minPrice, defaultCurrency)
    }
    
    // Si hay diferentes precios, mostrar rango: menor - mayor
    const hasAnyOriginalPrice = originalPrices.length > 0
    if (hasAnyOriginalPrice) {
      const minOriginalPrice = Math.min(...originalPrices)
      const maxOriginalPrice = Math.max(...originalPrices)
      
      return (
        <div className="flex flex-col items-start">
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(minOriginalPrice, defaultCurrency)} - {formatPrice(maxOriginalPrice, defaultCurrency)}
          </span>
          <span className="text-sm font-medium text-red-600">
            {formatPrice(minPrice, defaultCurrency)} - {formatPrice(maxPrice, defaultCurrency)}
          </span>
        </div>
      )
    }
    
    return `${formatPrice(minPrice, defaultCurrency)} - ${formatPrice(maxPrice, defaultCurrency)}`
  }

  const renderInventory = (product: Product) => {
    if (!product.variants) return <span className="text-gray-500 dark:text-gray-400 text-sm">Sin stock</span>

    const totalInventory = product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)

    if (totalInventory <= 0) {
      return <span className="text-yellow-600 dark:text-yellow-500 text-sm">Sin stock</span>
    } else if (totalInventory < 5) {
      return <span className="text-orange-600 dark:text-orange-500 text-sm">{totalInventory} disponibles</span>
    } else {
      return <span className="text-emerald-600 dark:text-emerald-500 text-sm">{totalInventory} disponibles</span>
    }
  }

  const renderSkeletons = () =>
    Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell className="pl-6">
          <Skeleton className="h-4 w-4" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-sm" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Skeleton className="h-4 w-[150px]" />
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Skeleton className="h-4 w-[150px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-[80px]" />
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Skeleton className="h-4 w-[90px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-[70px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full" />
        </TableCell>
      </TableRow>
    ))


  // Reemplazar la función renderStatus para hacerla más minimalista en móvil
  const renderStatus = (product: Product) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640
    const getStatusConfig = () => {
      if (product.status === ProductStatus.ARCHIVED) {
        return {
          label: "Archivado",
          textClass: "text-orange-700 dark:text-orange-500",
          dotClass: "h-2.5 w-2.5 rounded-full shadow-sm bg-orange-500 ring-2 ring-orange-100 dark:ring-orange-900/50",
        }
      }

      if (!product.variants || product.status === ProductStatus.DRAFT) {
        return {
          label: "Borrador",
          textClass: "text-gray-600 dark:text-gray-400",
          dotClass: "h-2.5 w-2.5 rounded-full shadow-sm bg-gray-400 ring-2 ring-gray-200 dark:ring-gray-700",
        }
      }

      const totalInventory = product.variants.reduce(
        (total, variant) => total + (variant.inventoryQuantity || 0),
        0,
      )

      if (totalInventory === 0) {
        return {
          label: "Sin stock",
          textClass: "text-yellow-700 dark:text-yellow-500",
          dotClass: "h-2.5 w-2.5 rounded-full shadow-sm bg-yellow-400 ring-2 ring-yellow-100 dark:ring-yellow-900/50",
        }
      }

      return {
        label: "Activo",
        textClass: "text-emerald-700 dark:text-emerald-500",
        dotClass: "h-2.5 w-2.5 rounded-full shadow-sm bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/50",
      }
    }

    const { label, textClass, dotClass } = getStatusConfig()

    if (isMobile) {
      return <span className={textClass}>{label}</span>
    }

    return (
      <div className="flex gap-2 items-center">
        <div className={dotClass}></div>
        <span className={textClass}>{label}</span>
      </div>
    )
  }

  // Reemplazar el renderMobileProductCard con esta versión más minimalista
  const renderMobileProductCard = (product: Product) => (
    <div key={product.id} className="border-b py-3 px-2 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => toggleProductSelection(product.id)}
            className="mr-1"
          />
          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            {product.imageUrls && product.imageUrls[0] ? (
              <img
                className="h-full w-full object-contain"
                src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                alt={product.title}
              />
            ) : (
              <Package className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs text-muted-foreground">{renderPrice(product)}</div>
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <div className="text-xs">{renderStatus(product)}</div>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleQuickEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edición Rápida
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openConfirmDelete(product)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
            {renderArchiveMenuItem(product)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  // Reemplazar el renderMobileEmptyState con esta versión más minimalista
  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay productos</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {!currentStore
            ? "No hay productos para esta tienda."
            : searchTerm
              ? `No hay coincidencias para "${searchTerm}"`
              : "No hay productos disponibles en esta tienda."}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {(searchTerm || selectedVendors.length > 0 || selectedCategories.length > 0) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedVendors([])
                setSelectedCategories([])
                setIncludeArchived(false)
              }} 
              className="w-full text-sm h-9"
            >
              Limpiar filtros
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (currentStore) {
                refetchProducts() // forzar refresco
              }
            }}
            className="w-full text-sm h-9"
          >
            <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )

  // Renderizado de filas de productos para pantallas de escritorio (vista de tabla)
  const renderDesktopProductRow = (product: Product) => (
    <TableRow
      key={product.id}
      className="animate-fadeIn transition-all hover:bg-gray-50 dark:hover:bg-gray-900/30"
    >
      <TableCell className="pl-6">
        <Checkbox
          checked={selectedProducts.includes(product.id)}
          onCheckedChange={() => toggleProductSelection(product.id)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          {product.imageUrls && product.imageUrls[0] ? (
            <img
              className="h-8 w-8 object-contain bg-white rounded-sm"
              src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
              alt={product.title}
            />
          ) : (
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
              <Package className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <p className="truncate max-w-[200px] md:max-w-[340px]">{product.title}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center">
          <span className="truncate max-w-[150px]">{product.collections?.[0]?.title || "-"}</span>
          {product.collections && product.collections.length > 1 && (
            <span className="ml-2 rounded-full bg-muted/30 text-sky-600 dark:text-sky-400 text-xs px-2 py-0">
              +{product.collections.length - 1}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center">
          <span className="truncate max-w-[150px]">{product.categories?.[0]?.name || "-"}</span>
          {product.categories && product.categories.length > 1 && (
            <span className="ml-2 rounded-full bg-muted/20 text-sky-600 dark:text-sky-400 text-xs px-2 py-0">
              +{product.categories.length - 1}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{renderPrice(product)}</TableCell>
      <TableCell className="hidden sm:table-cell">{renderInventory(product)}</TableCell>
      <TableCell>{renderStatus(product)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleQuickEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edición Rápida
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openConfirmDelete(product)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
            {renderArchiveMenuItem(product)}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  const handleQuickEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsQuickEditOpen(true)
  }

  // Handlers para el filtro de vendors
  const handleVendorToggle = (vendor: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]
    )
  }

  const handleRemoveVendor = (vendor: string) => {
    setSelectedVendors(prev => prev.filter(v => v !== vendor))
  }

  // Handlers para el filtro de categorías
  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategories(prev => 
      prev.includes(categorySlug) ? prev.filter(c => c !== categorySlug) : [...prev, categorySlug]
    )
  }

  const handleRemoveCategory = (categorySlug: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== categorySlug))
  }

  const confirmMeta = useMemo(() => {
    const productTitle = confirmAction.product?.title

    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Eliminar producto",
          description: `Esta acción es irreversible. Se eliminarán también sus variantes, precios y el Kardex (incluyendo movimientos).${productTitle ? `\n\nProducto: "${productTitle}"` : ""}`,
          actionLabel: "Eliminar",
          destructive: true,
        }
      case "bulkDelete":
        return {
          title: "Eliminar productos",
          description: `Esta acción es irreversible. Se eliminarán también variantes, precios y el Kardex de cada producto.\n\nCantidad: ${confirmAction.productIds.length}`,
          actionLabel: "Eliminar",
          destructive: true,
        }
      case "archive":
        return {
          title: "Archivar producto",
          description: `El producto pasará a estado ARCHIVED. Las variantes mantendrán su estado actual.${productTitle ? `\n\nProducto: "${productTitle}"` : ""}`,
          actionLabel: "Archivar",
          destructive: false,
        }
      case "unarchive":
        return {
          title: "Desarchivar producto",
          description: `El producto pasará a ACTIVE. Las variantes mantendrán su estado actual.${productTitle ? `\n\nProducto: "${productTitle}"` : ""}`,
          actionLabel: "Desarchivar",
          destructive: false,
        }
      default:
        return {
          title: "Confirmar acción",
          description: "¿Deseas continuar?",
          actionLabel: "Confirmar",
          destructive: false,
        }
    }
  }, [confirmAction.product?.title, confirmAction.productIds.length, confirmAction.type])

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Productos" jsonData={{ products, shopSettings }} />
      <AlertDialog
        open={confirmAction.open}
        onOpenChange={(open) => {
          if (!open) closeConfirmAction()
          else setConfirmAction((prev) => ({ ...prev, open: true }))
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMeta.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmMeta.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActionLoading}
              className={confirmMeta.destructive ? buttonVariants({ variant: "destructive" }) : undefined}
              onClick={(e) => {
                // Evitar que Radix cierre el dialog antes de completar la acción
                e.preventDefault()
                runConfirmedAction()
              }}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {confirmMeta.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollArea className="h-[calc(100vh-5.5rem)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Productos</h3>
                <div className="flex items-center gap-2">
                  {/* Export Button with Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="hidden sm:flex gap-2">
                        <FileDown className="h-4 w-4" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={openDialog}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar a PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openCSVDialog}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar a CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Create Product Button */}
                  <Link href="/products/new">
                    <Button size="icon" className="sm:hidden h-9 w-9 create-button">
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button className="hidden sm:flex create-button">
                      <Plus className="h-4 w-4 mr-2" /> Crear Producto
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Barra de búsqueda y filtros mejorada */}
            <div className="box-section flex-col gap-4">
              {/* Primera fila: Búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos por nombre, descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Contenedor de filtros */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Filtro de Marca */}
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value=""
                      onValueChange={(value) => value && !selectedVendors.includes(value) && handleVendorToggle(value)}
                      disabled={isLoadingVendors || vendors.length === 0}
                    >
                      <SelectTrigger className="w-[140px] sm:w-[160px] text-foreground pl-8">
                        <SelectValue placeholder={isLoadingVendors ? "Cargando..." : "Marca"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.length === 0 ? (
                          <SelectItem value="no-vendors" disabled>Sin marcas disponibles</SelectItem>
                        ) : (
                          vendors.map((vendor) => (
                            <SelectItem key={vendor} value={vendor} disabled={selectedVendors.includes(vendor)}>
                              {vendor}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Categoría */}
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value=""
                      onValueChange={(value) => value && !selectedCategories.includes(value) && handleCategoryToggle(value)}
                      disabled={isLoadingCategories || categoryList.length === 0}
                    >
                      <SelectTrigger className="w-[140px] sm:w-[160px] text-foreground pl-8">
                        <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Categoría"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryList.length === 0 ? (
                          <SelectItem value="no-categories" disabled>Sin categorías disponibles</SelectItem>
                        ) : (
                          categoryList.map((category) => (
                            <SelectItem key={category.slug} value={category.slug} disabled={selectedCategories.includes(category.slug)}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pl-1">
                    <Switch
                      checked={includeArchived}
                      onCheckedChange={(checked) => {
                        setIncludeArchived(checked)
                        setCurrentPage(1)
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Incluir archivados
                    </span>
                  </div>

                </div>
              </div>

              {/* Segunda fila: Filtros activos y acciones */}
              {(searchTerm || selectedVendors.length > 0 || selectedCategories.length > 0 || selectedProducts.length > 0) && (
                <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
                  {/* Filtros activos */}
                  {(searchTerm || selectedVendors.length > 0 || selectedCategories.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filtros activos:</span>
                      </div>

                      {/* Badge de búsqueda */}
                      {searchTerm && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Search className="h-3 w-3" />
                          <span className="max-w-[200px] truncate">{searchTerm}</span>
                          <button
                            onClick={() => setSearchTerm("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar búsqueda"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badges de marcas seleccionadas */}
                      {selectedVendors.map((vendor) => (
                        <Badge key={vendor} variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Building2 className="h-3 w-3" />
                          <span>{vendor}</span>
                          <button
                            onClick={() => handleRemoveVendor(vendor)}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label={`Quitar marca ${vendor}`}
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      ))}

                      {/* Badges de categorías seleccionadas */}
                      {selectedCategories.map((categorySlug) => {
                        const category = categoryList.find(c => c.slug === categorySlug)
                        return (
                          <Badge key={categorySlug} variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                            <Tag className="h-3 w-3" />
                            <span>{category?.name || categorySlug}</span>
                            <button
                              onClick={() => handleRemoveCategory(categorySlug)}
                              className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                              type="button"
                              aria-label={`Quitar categoría ${category?.name || categorySlug}`}
                            >
                              <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                            </button>
                          </Badge>
                        )
                      })}

                      {/* Botón para limpiar todos los filtros */}
                      {(searchTerm || selectedVendors.length > 0 || selectedCategories.length > 0) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedVendors([])
                            setSelectedCategories([])
                            setIncludeArchived(false)
                          }} 
                          className="h-7 text-xs gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Acciones de productos seleccionados */}
                  {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <span className="text-sm text-muted-foreground">
                        {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} seleccionado{selectedProducts.length > 1 ? 's' : ''}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleBulkDelete} 
                        className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar seleccionados
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex flex-col w-full p-6 space-y-4">
                  <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                    <div>
                      <p className="font-medium text-sky-700 dark:text-sky-400">Cargando productos</p>
                      <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
                    </div>
                  </div>

                  <div className="sm:hidden space-y-4">
                    {Array.from({ length: MOBILE_SKELETON_COUNT }, (_, i) => (
                      <div key={i} className="border-b py-3 px-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                            <div className="flex-1">
                              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block w-full">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px] pl-6" />
                          <TableHead className="w-[300px]">Producto</TableHead>
                          <TableHead className="hidden md:table-cell w-[150px]">Colección</TableHead>
                          <TableHead className="hidden md:table-cell w-[150px]">Categorías</TableHead>
                          <TableHead className="w-[120px]">Precio</TableHead>
                          <TableHead className="hidden sm:table-cell w-[120px]">Inventario</TableHead>
                          <TableHead className="w-[120px]">Estado</TableHead>
                          <TableHead className="w-[50px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{renderSkeletons()}</TableBody>
                    </Table>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox disabled />
                            </TableHead>
                            <TableHead className="w-[300px]">Producto</TableHead>
                            <TableHead className="hidden md:table-cell w-[150px]">Colección</TableHead>
                            <TableHead className="hidden md:table-cell w-[150px]">Categorías</TableHead>
                            <TableHead className="w-[120px]">Precio</TableHead>
                            <TableHead className="hidden sm:table-cell w-[120px]">Inventario</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>
                  </div>

                  {/* Vista móvil para pantallas pequeñas */}
                  <div className="sm:hidden">{renderMobileEmptyState()}</div>

                  <div className="hidden sm:flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No hay productos encontrados</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {!currentStore
                        ? "No hay productos para esta tienda."
                        : searchTerm
                          ? `No hay productos que coincidan con los filtros aplicados "${searchTerm}".`
                          : "No hay productos disponibles en esta tienda."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(searchTerm || selectedVendors.length > 0 || selectedCategories.length > 0) && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedVendors([])
                            setSelectedCategories([])
                            setIncludeArchived(false)
                          }} 
                          className="w-full sm:w-auto"
                        >
                          Limpiar filtros
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (currentStore) {
                            refetchProducts() // forzar refresco
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        <svg
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Actualizar datos
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox
                                checked={
                                  selectedProducts.length === products.length && products.length > 0
                                }
                                onCheckedChange={toggleAllProducts}
                              />
                            </TableHead>
                            <TableHead className="w-[300px]">Producto</TableHead>
                            <TableHead className="hidden md:table-cell w-[150px]">Colección</TableHead>
                            <TableHead className="hidden md:table-cell w-[150px]">Categorías</TableHead>
                            <TableHead className="w-[120px]">Precio</TableHead>
                            <TableHead className="hidden sm:table-cell w-[120px]">Inventario</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map(renderDesktopProductRow)}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Vista de tarjetas para móviles */}
                  <div className="sm:hidden w-full">
                    {selectedProducts.length > 0 && (
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onCheckedChange={toggleAllProducts}
                            className="mr-2"
                          />
                          <span className="text-xs font-medium">{selectedProducts.length} seleccionados</span>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-7 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}

                    {!selectedProducts.length && (
                      <div className="flex items-center py-2 border-b px-2">
                        <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onCheckedChange={toggleAllProducts}
                          className="mr-2"
                        />
                        <span className="text-xs font-medium">Seleccionar todos</span>
                      </div>
                    )}

                    {products.map(renderMobileProductCard)}
                  </div>
                </>
              )}
            </div>

            {(products.length > 0 || productsPagination) && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  {productsPagination ? (
                    <>
                      Mostrando {(productsPagination.page - 1) * productsPagination.limit + 1} a{" "}
                      {Math.min(productsPagination.page * productsPagination.limit, productsPagination.total)} de{" "}
                      {productsPagination.total} productos
                    </>
                  ) : (
                    `${products.length} productos`
                  )}
                </div>
                {productsPagination && productsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                    <nav className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Página anterior</span>
                      </Button>

                      {/* Paginación para pantallas medianas y grandes */}
                      <div className="hidden xs:flex">
                        {(() => {
                          const totalPages = productsPagination.totalPages
                          const maxVisiblePages = 5
                          let startPage = 1
                          let endPage = totalPages

                          if (totalPages > maxVisiblePages) {
                            // Calcular páginas a mostrar
                            if (currentPage <= 3) {
                              // Estamos cerca del inicio
                              endPage = 5
                            } else if (currentPage >= totalPages - 2) {
                              // Estamos cerca del final
                              startPage = totalPages - 4
                            } else {
                              // Estamos en el medio
                              startPage = currentPage - 2
                              endPage = currentPage + 2
                            }
                          }

                          const pages = []

                          // Añadir primera página si no está incluida en el rango
                          if (startPage > 1) {
                            pages.push(
                              <Button
                                key="1"
                                variant={currentPage === 1 ? "default" : "ghost"}
                                size="icon"
                                className="h-7 w-7 rounded-sm"
                                onClick={() => paginate(1)}
                                disabled={isLoading}
                              >
                                1
                              </Button>,
                            )

                            // Añadir elipsis si hay un salto
                            if (startPage > 2) {
                              pages.push(
                                <span key="start-ellipsis" className="px-1 text-muted-foreground">
                                  ...
                                </span>,
                              )
                            }
                          }

                          // Añadir páginas del rango calculado
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "ghost"}
                                size="icon"
                                className="h-7 w-7 rounded-sm"
                                onClick={() => paginate(i)}
                                disabled={isLoading}
                              >
                                {i}
                              </Button>,
                            )
                          }

                          // Añadir última página si no está incluida en el rango
                          if (endPage < totalPages) {
                            // Añadir elipsis si hay un salto
                            if (endPage < totalPages - 1) {
                              pages.push(
                                <span key="end-ellipsis" className="px-1 text-muted-foreground">
                                  ...
                                </span>,
                              )
                            }

                            pages.push(
                              <Button
                                key={totalPages}
                                variant={currentPage === totalPages ? "default" : "ghost"}
                                size="icon"
                                className="h-7 w-7 rounded-sm"
                                onClick={() => paginate(totalPages)}
                                disabled={isLoading}
                              >
                                {totalPages}
                              </Button>,
                            )
                          }

                          return pages
                        })()}
                      </div>

                      {/* Input de navegación directa a página */}
                      <div className="flex xs:hidden items-center px-2 text-xs font-medium gap-1">
                        <Input
                          type="text"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmPageNavigation()
                            }
                          }}
                          className="w-12 h-6 text-center text-xs border-0 bg-white focus:bg-white focus:border focus:border-primary"
                          disabled={isLoading}
                          placeholder="1"
                        />
                        {pageInput !== currentPage.toString() && pageInput.trim() !== "" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={confirmPageNavigation}
                            disabled={isLoading}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <span>/ {productsPagination.totalPages}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage >= productsPagination.totalPages || isLoading}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Página siguiente</span>
                      </Button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {selectedProduct && (
        <QuickEditDialog
          open={isQuickEditOpen}
          onOpenChange={(open) => {
            if (!open) setIsQuickEditOpen(false)
            else setIsQuickEditOpen(true)
          }}
          onClose={(saved) => handleQuickEditClose(saved)}
          product={selectedProduct}
          vendors={vendors}
          isLoadingVendors={isLoadingVendors}
        />
      )}

      {/* PDF Export Dialog */}
      <ExportPDFDialog
        open={isDialogOpen}
        onOpenChange={closeDialog}
        onExport={(designConfig) => handleGeneratePDF(designConfig, searchTerm, selectedVendors, selectedCategories)}
        storeLogo={shopSettings.find(s => s.storeId === currentStore)?.logo || undefined}
        shopSettings={getCurrentShopSettings()}
        isExporting={isExporting}
        currencies={getCurrentShopSettings()?.acceptedCurrencies?.filter(c => c.isActive) || currencies.filter(c => c.isActive)}
        defaultCurrencyId={getCurrentShopSettings()?.defaultCurrencyId}
      />

      {/* CSV Export Dialog */}
      <ExportCSVDialog
        open={isCSVDialogOpen}
        onOpenChange={closeCSVDialog}
        onExport={(config) => handleCSVExport(config, searchTerm, selectedVendors, selectedCategories)}
        isExporting={isCSVExporting}
        type="products"
      />
    </div>
  )
}
