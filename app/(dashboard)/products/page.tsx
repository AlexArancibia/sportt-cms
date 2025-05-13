"use client"

import { useEffect, useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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

export default function ProductsPage() {
  const { products, shopSettings, currentStore, fetchProductsByStore, fetchShopSettings, deleteProduct } =
    useMainStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const productsPerPage = 20

  useEffect(() => {
    const loadData = async () => {
      // Skip fetching if no store is selected
      if (!currentStore) {
        console.log("No store selected, skipping product fetch")
        setFilteredProducts([]) // Reset products when no store is selected
        return
      }

      setIsLoading(true)
      try {
        console.log("Fetching products for store:", currentStore)
        const fetchedProducts = await fetchProductsByStore(currentStore)
        await fetchShopSettings()

        // Update filtered products based on the fetched data and current search term
        setFilteredProducts(
          fetchedProducts
            .filter(
              (product) =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .reverse(), // Reverse the order of products
        )
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch products. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentStore, fetchProductsByStore, fetchShopSettings, searchTerm, toast])

  // Update filtered products when products or search term changes
  useEffect(() => {
    setFilteredProducts(
      products
        .filter(
          (product) =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .reverse(), // Invertir el orden de los productos
    )
  }, [products, searchTerm])

  const handleDelete = async (productId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      setIsLoading(true)
      try {
        await deleteProduct(productId)
        // Explicitly refetch products after deletion
        if (currentStore) {
          const refreshedProducts = await fetchProductsByStore(currentStore)
          setFilteredProducts(
            refreshedProducts
              .filter(
                (product) =>
                  product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .reverse(),
          )
        }
        toast({
          title: "Éxito",
          description: "Producto eliminado correctamente",
        })
      } catch (error) {
        console.error("Error deleting product:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al eliminar el producto",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar ${selectedProducts.length} productos?`)) {
      setIsLoading(true)
      try {
        // Delete each product
        for (const productId of selectedProducts) {
          await deleteProduct(productId)
        }

        // Clear selection
        setSelectedProducts([])

        // Explicitly refetch products after deletion
        if (currentStore) {
          const refreshedProducts = await fetchProductsByStore(currentStore)
          setFilteredProducts(
            refreshedProducts
              .filter(
                (product) =>
                  product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .reverse(),
          )
        }

        toast({
          title: "Éxito",
          description: `${selectedProducts.length} productos eliminados correctamente`,
        })
      } catch (error) {
        console.error("Error deleting products:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al eliminar los productos",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleQuickEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsQuickEditOpen(true)
  }

  // Update the QuickEditDialog component to refresh products after closing
  const handleQuickEditClose = async (updated: boolean) => {
    setIsQuickEditOpen(false)

    // If the product was updated, refresh the product list
    if (updated && currentStore) {
      try {
        // Don't set isLoading to true here to avoid flickering
        const refreshedProducts = await fetchProductsByStore(currentStore)

        // Update filtered products while maintaining the current view
        setFilteredProducts(
          refreshedProducts
            .filter(
              (product) =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .reverse(),
        )
      } catch (error) {
        console.error("Error refreshing products:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to refresh products. Please try again.",
        })
      }
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const toggleAllProducts = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(currentProducts.map((product) => product.id))
    }
  }

  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const renderPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return "-"

    const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId
    if (!defaultCurrencyId) return "-"

    const variantPrices = product.variants
      .flatMap((variant) => variant.prices || [])
      .filter((price) => price.currencyId === defaultCurrencyId)
      .map((price) => price.price)

    if (variantPrices.length === 0) return "-"

    const minPrice = Math.min(...variantPrices)
    const maxPrice = Math.max(...variantPrices)
    const currency = product.variants[0]?.prices?.[0]?.currency

    if (!currency) return "-"

    return minPrice === maxPrice
      ? formatPrice(minPrice, currency)
      : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`
  }

  const renderInventory = (product: Product) => {
    if (!product.variants) return "Sin stock"

    const totalInventory = product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)

    return totalInventory > 0 ? `${totalInventory} disponibles` : "Sin stock"
  }

  const renderStatus = (product: Product) => {
    if (!product.variants) {
      return (
        <div className="flex gap-2 items-center">
          <div className="h-2 w-2 shadow-sm bg-gray-500"></div>
          <span>Borrador</span>
        </div>
      )
    }

    const totalInventory = product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)

    // Primero verificamos el estado del producto
    if (product.status === ProductStatus.DRAFT) {
      return (
        <div className="flex gap-2 items-center">
          <div className="h-2 w-2 shadow-sm bg-gray-500"></div>
          <span>Borrador</span>
        </div>
      )
    }

    // Si el producto está activo, mostramos el estado de inventario
    if (totalInventory === 0) {
      return (
        <div className="flex gap-2 items-center">
          <div className="h-2 w-2 shadow-sm bg-yellow-500"></div>
          <span>Sin stock</span>
        </div>
      )
    }

    return (
      <div className="flex gap-2 items-center">
        <div className="h-2 w-2 shadow-sm bg-emerald-500"></div>
        <span>Activo</span>
      </div>
    )
  }

  const renderProductRow = (product: Product) => (
    <TableRow key={product.id}>
      <TableCell className="pl-6">
        <Checkbox
          checked={selectedProducts.includes(product.id)}
          onCheckedChange={() => toggleProductSelection(product.id)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          {product.imageUrls && product.imageUrls[0] && (
            <img
              className="h-8 w-8 object-contain bg-white rounded-sm"
              src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
              alt={product.title}
            />
          )}
          <p className="truncate max-w-[340px]">{product.title}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <span className="truncate max-w-[150px]">{product.collections?.[0]?.title || "-"}</span>
          {product.collections && product.collections.length > 1 && (
            <span className="ml-2 rounded-full bg-muted/30 text-sky-600 dark:text-sky-400 text-xs px-2 py-0">
              +{product.collections.length - 1}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
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
      <TableCell>{renderInventory(product)}</TableCell>
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
            <DropdownMenuItem onClick={() => handleDelete(product.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      <HeaderBar title="Productos" />

      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between">
              <h3>Productos</h3>
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Crear Producto
                </Button>
              </Link>
            </div>

            <div className="box-section justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedProducts.length > 0 && (
                <Button variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedProducts.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                  <span className="ml-2 text-lg">Cargando productos...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-8 text-center">
                  <p className="text-lg mb-2">No hay productos disponibles</p>
                  <p className="text-muted-foreground mb-4">
                    {!currentStore
                      ? "Seleccione una tienda para ver los productos"
                      : "Cree un nuevo producto o cambie los criterios de búsqueda"}
                  </p>
                  {currentStore && (
                    <Link href="/products/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Crear Producto
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] pl-6">
                        <Checkbox
                          checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                          onCheckedChange={toggleAllProducts}
                        />
                      </TableHead>
                      <TableHead className="min-w-[300px]">Producto</TableHead>
                      <TableHead>Colección</TableHead>
                      <TableHead>Categorías</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Inventario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>{currentProducts.map(renderProductRow)}</TableBody>
                </Table>
              )}
            </div>

            {filteredProducts.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm">
                <div>
                  Mostrando {indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredProducts.length)} de{" "}
                  {filteredProducts.length} productos
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={indexOfLastProduct >= filteredProducts.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {selectedProduct && (
        <QuickEditDialog
          open={isQuickEditOpen}
          onOpenChange={(open) => {
            if (!open) {
              // Only call handleQuickEditClose when closing the dialog
              handleQuickEditClose(true)
            } else {
              setIsQuickEditOpen(true)
            }
          }}
          product={selectedProduct}
        />
      )}
    </>
  )
}
