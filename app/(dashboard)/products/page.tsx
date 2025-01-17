'use client'

import { useEffect, useState } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/types/product'
import { HeaderBar } from '@/components/HeaderBar'
import { getImageUrl } from '@/lib/imageUtils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function ProductsPage() {
  const { products, shopSettings, fetchProducts, fetchShopSettings, deleteProduct } = useMainStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10

  useEffect(() => {
    fetchProducts()
    fetchShopSettings()
  }, [fetchProducts, fetchShopSettings])

  useEffect(() => {
    setFilteredProducts(
      products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [products, searchTerm])

  const handleDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId)
    }
  }

  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <HeaderBar title='Productos' />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Productos</h3>
            <Link href="/products/new">
              <Button className='bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white'>
                <Plus className="h-4 w-4 mr-2" /> Create
              </Button>
            </Link>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className='box-section p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-6 w-[350px]'>Product</TableHead>
                  <TableHead className='w-[200px]'>Collection</TableHead>
                  <TableHead className='w-[200px]'>Categories</TableHead>
                  <TableHead className='w-[200px]'>Price</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {currentProducts.map((product) => (
                  <TableRow key={product.id} className='content-font'>
                    <TableCell className="pl-6 text-gray-500">
                      <div className='flex items-center gap-4 text-primary'>
                        {product.imageUrls.length > 0 ?
                          (<img className="h-8 w-8 object-contain bg-white rounded-sm" src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"} alt={product.title} />) :
                          (<div className='w-8 h-8 bg-white rounded-sm dark:bg-zinc-800'></div>)}
                        <p className='content-font'>{product.title}</p>
                      </div>
                    </TableCell>
                    <TableCell className='text-primary'>
                      {product.collections[0]?.title || "-"}
                    </TableCell>
                    <TableCell>
                      {product.categories[0]?.name || '-'}
                      {product.categories.length > 1 && (
                        <span className="ml-2 rounded-full bg-gray-200 text-xs text-gray-700 px-2 py-1">
                          +{product.categories.length - 1}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId;
                        if (!defaultCurrencyId) return "-";
                        const priceData = product.prices.find(price => price.currencyId === defaultCurrencyId);
                        if (!priceData) return "-";
                        const { currency, price } = priceData;
                        const numericPrice = Number(price);
                        if (isNaN(numericPrice)) return "-";
                        const formattedPrice = numericPrice.toFixed(currency.decimalPlaces);
                        return currency.symbolPosition === "BEFORE"
                          ? `${currency.symbol}${formattedPrice}`
                          : `${formattedPrice}${currency.symbol}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const productInventory = product.inventoryQuantity || 0;
                        const variantsInventory = product.variants
                          ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                          : 0;
                        const totalInventory = productInventory + variantsInventory;

                        return totalInventory > 0 
                          ? `${totalInventory} disponibles` 
                          : "Sin stock";
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const productInventory = product.inventoryQuantity || 0;
                        const variantsInventory = product.variants
                          ? product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0)
                          : 0;
                        const totalInventory = productInventory + variantsInventory;

                        if (product.isArchived) {
                          return (
                            <div className='flex gap-2 items-center'>
                              <div className='h-2 w-2 shadow-sm bg-red-500 '></div>
                              <span>Archivado</span>
                            </div>
                          );
                        } else if (totalInventory === 0) {
                          return (
                            <div className='flex gap-2 items-center'>
                              <div className='h-2 w-2 shadow-sm bg-yellow-500 '></div>
                              <span>Sin stock</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className='flex gap-2 items-center'>
                              <div className='h-2 w-2 shadow-sm bg-emerald-500 '></div>
                              <span>Publicado</span>
                            </div>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-5 w-5 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}/edit`} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4 text-primary" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product.id)} className="flex items-center text-red-600">
                            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="box-section border-none justify-between items-center ">
            <div className='content-font'>
              Mostrando {indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} productos
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
              >
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

