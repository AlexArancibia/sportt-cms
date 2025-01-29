"use client"

import { useEffect, useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Grid, List } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/types/product"
import { HeaderBar } from "@/components/HeaderBar"
import { getImageUrl } from "@/lib/imageUtils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilterDialog, FilterOptions } from "./_components/FilterDialog"

export default function ProductsPage() {
  const { products, shopSettings, fetchProducts, fetchShopSettings, deleteProduct } = useMainStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    collections: [],
    minPrice: 0,
    maxPrice: Number.POSITIVE_INFINITY,
    sortBy: "name_asc",
  })
  const productsPerPage = 12

  useEffect(() => {
    fetchProducts()
    fetchShopSettings()
  }, [fetchProducts, fetchShopSettings])

  useEffect(() => {
    setFilteredProducts(
      products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [products, searchTerm])

  const handleDelete = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct(productId)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      selectedProducts.forEach((productId) => deleteProduct(productId))
      setSelectedProducts([])
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

  const handleApplyFilters = (newFilterOptions: FilterOptions) => {
    setFilterOptions(newFilterOptions)
    setIsFilterDialogOpen(false)
  }


  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const renderProductList = () => (
    <Table>
      <TableHeader>
        <TableRow className="">
          <TableHead className="pl-6  w-[50px]">
            <Checkbox
              checked={selectedProducts.length === currentProducts.length}
              onCheckedChange={toggleAllProducts}
            />
          </TableHead>
          <TableHead className="w-[340px]">Producto</TableHead>
          <TableHead className="w-[200px]">Colección</TableHead>
          <TableHead className="w-[200px]">Categorías</TableHead>
          <TableHead className="w-[200px]">Precio</TableHead>
          <TableHead>Inventorio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead> </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentProducts.map((product) => (
          <TableRow key={product.id} className="content-font">
            <TableCell className="pl-6 ">
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={() => toggleProductSelection(product.id)}
              />
            </TableCell>
            <TableCell className="  text-gray-500">
              <div className="flex items-center gap-4 text-primary">
                {product.imageUrls.length > 0 ? (
                  <img
                    className="h-8 w-8 object-contain bg-white rounded-sm"
                    src={getImageUrl(product.imageUrls[0])  }
                    alt={product.title}
                  />
                ) : (
                  <div className="w-8 h-8 bg-white rounded-sm dark:bg-zinc-800"></div>
                )}
                <p className="content-font w-[340px] pr-4 truncate">{product.title}</p>
              </div>
            </TableCell>
            <TableCell className="text-primary">{product.collections[0]?.title || "-"}</TableCell>
            <TableCell>
            <div className="flex items-center">
            <span className="truncate max-w-[150px]">{product.categories[0]?.name || "-"}</span>
            {product.categories.length > 1 && (
              <span className="ml-2 rounded-full bg-gray-200 text-xs text-gray-700 px-2 py-1">
                +{product.categories.length - 1}
              </span>
            )}
          </div>

            </TableCell>
            <TableCell>
            {(() => {
                const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId
                if (!defaultCurrencyId) return "-"

                // Function to format price
                const formatPrice = (price: number, currency: any) => {
                  const formattedPrice = price.toFixed(currency.decimalPlaces)
                  return currency.symbolPosition === "BEFORE"
                    ? `${currency.symbol}${formattedPrice}`
                    : `${formattedPrice}${currency.symbol}`
                }

                // Check if the product has variants
                if (product.variants && product.variants.length > 0) {
                  // Get all prices for the default currency across variants
                  const variantPrices = product.variants
                    .map((variant) => variant.prices.find((price) => price.currencyId === defaultCurrencyId))
                    .filter((price) => price !== undefined)
                    .map((price) => price!.price)

                  if (variantPrices.length === 0) return "-"

                  const minPrice = Math.min(...variantPrices)
                  const maxPrice = Math.max(...variantPrices)

                  const currency = product.variants[0].prices.find(
                    (price) => price.currencyId === defaultCurrencyId,
                  )?.currency

                  if (!currency) return "-"

                  if (minPrice === maxPrice) {
                    return formatPrice(minPrice, currency)
                  } else {
                    return `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`
                  }
                } else {
                  // If no variants, use the product's price
                  const priceData = product.prices.find((price) => price.currencyId === defaultCurrencyId)
                  if (!priceData) return "-"
                  const { currency, price } = priceData
                  const numericPrice = Number(price)
                  if (isNaN(numericPrice)) return "-"
                  return formatPrice(numericPrice, currency)
                }
              })()}
            </TableCell>
            <TableCell>
              {(() => {
                const productInventory = product.inventoryQuantity || 0
                const variantsInventory = product.variants
                  ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                  : 0
                const totalInventory = productInventory + variantsInventory

                return totalInventory > 0 ? `${totalInventory} disponibles` : "Sin stock"
              })()}
            </TableCell>
            <TableCell>
              {(() => {
                const productInventory = product.inventoryQuantity || 0
                const variantsInventory = product.variants
                  ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                  : 0
                const totalInventory = productInventory + variantsInventory

                if (product.isArchived) {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-red-500 "></div>
                      <span>Archivado</span>
                    </div>
                  )
                } else if (totalInventory === 0) {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-yellow-500 "></div>
                      <span>Sin stock</span>
                    </div>
                  )
                } else {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-emerald-500 "></div>
                      <span>Publicado</span>
                    </div>
                  )
                }
              })()}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}/edit`} className="flex items-center">
                      <Pencil className="mr-2 h-4 w-4 text-primary" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(product.id)} className="flex items-center text-red-600">
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderProductGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {currentProducts.map((product) => (
        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <Checkbox
              className="shadow-none"
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={() => toggleProductSelection(product.id)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}/edit`} className="flex items-center">
                    <Pencil className="mr-2 h-4 w-4 text-primary" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(product.id)} className="flex items-center text-red-600">
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-center mb-4">
            {product.imageUrls.length > 0 ? (
              <img
                className="h-32 w-32 object-contain"
                src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                alt={product.title}
              />
            ) : (
              <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                No Image
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {product.collections[0]?.title || "No Collection"}
          </p>
          <p className="text-sm font-medium mb-2">
            {(() => {
              const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId
              if (!defaultCurrencyId) return "-"
              const priceData = product.prices.find((price) => price.currencyId === defaultCurrencyId)
              if (!priceData) return "-"
              const { currency, price } = priceData
              const numericPrice = Number(price)
              if (isNaN(numericPrice)) return "-"
              const formattedPrice = numericPrice.toFixed(currency.decimalPlaces)
              return currency.symbolPosition === "BEFORE"
                ? `${currency.symbol}${formattedPrice}`
                : `${formattedPrice}${currency.symbol}`
            })()}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm">
              {(() => {
                const productInventory = product.inventoryQuantity || 0
                const variantsInventory = product.variants
                  ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                  : 0
                const totalInventory = productInventory + variantsInventory

                return totalInventory > 0 ? `${totalInventory} disponibles` : "Sin stock"
              })()}
            </span>
            <span className="text-sm">
              {(() => {
                const productInventory = product.inventoryQuantity || 0
                const variantsInventory = product.variants
                  ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                  : 0
                const totalInventory = productInventory + variantsInventory

                if (product.isArchived) {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-red-500 rounded-full"></div>
                      <span>Archivado</span>
                    </div>
                  )
                } else if (totalInventory === 0) {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-yellow-500 rounded-full"></div>
                      <span>Sin stock</span>
                    </div>
                  )
                } else {
                  return (
                    <div className="flex gap-2 items-center">
                      <div className="h-2 w-2 shadow-sm bg-emerald-500 rounded-full"></div>
                      <span>Publicado</span>
                    </div>
                  )
                }
              })()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <HeaderBar title="Productos" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h4>Productos</h4>
            <div className="flex space-x-2">
              <Link href="/products/new">
                <Button className="create-button">
                  <Plus className="h-4 w-4 mr-2" /> Crear Producto
                </Button>
              </Link>
              
            </div>
          </div>
          <div className="box-section  justify-between">

            <div className="flex items-center space-x-2">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 text-gray-500 -translate-y-1/2" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 h-8 bg-accent/40 "
              />


            </div>

            
            </div>
            <div className="flex items-center space-x-2">
            {/* <Button variant="outline" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
                {viewMode === "list" ? <Grid className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
                {viewMode === "list" ? "Grid View" : "List View"}
              </Button> */}
              {selectedProducts.length > 0 && (
                <Button variant="outline" className="" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4" />({selectedProducts.length})
                </Button>
              )}
            </div>
            


          </div>
          <div className="box-section   p-0">{viewMode === "list" ? renderProductList() : renderProductGrid()}</div>
          <div className="box-section border-none justify-between items-center ">
            <div className="content-font">
              Mostrando {indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredProducts.length)} de{" "}
              {filteredProducts.length} productos
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastProduct >= filteredProducts.length}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

