'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Trash2, Pencil, LayoutGrid, List, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useMainStore } from '@/stores/mainStore'
import { useToast } from "@/hooks/use-toast"
import { Product } from '@/types/product'
import { getImageUrl } from '@/lib/imageUtils'

const ProductSkeleton = () => (
  <TableRow>
    <TableCell className="w-[40px]"><Skeleton className="h-4 w-4" /></TableCell>
    <TableCell><Skeleton className="h-12 w-12" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[200px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
    <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
  </TableRow>
)

const ProductGridSkeleton = () => (
  <div>
    <Skeleton className="aspect-square mb-3 rounded-lg" />
    <div className="space-y-1">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
)

export default function ProductsPage() {
  const { products, categories, loading, error, fetchProducts, fetchCategories, deleteProduct } = useMainStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchProducts(), fetchCategories()])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchProducts, fetchCategories, toast])

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(productId => productId !== id) : [...prev, id]
    )
  }

  const deleteSelectedProducts = async () => {
    try {
      console.log('Attempting to delete products:', selectedProducts);
      await Promise.all(selectedProducts.map(async (id) => {
        try {
          await deleteProduct(id);
          console.log(`Successfully deleted product with id: ${id}`);
        } catch (error) {
          console.error(`Failed to delete product with id: ${id}`, error);
          throw error; // Re-throw to be caught by the outer catch
        }
      }));
      setSelectedProducts([]);
      toast({
        title: "Success",
        description: "Selected products deleted successfully",
      });
    } catch (err) {
      console.error('Error in deleteSelectedProducts:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete selected products. Please try again.",
      });
    } finally {
      // Refresh the product list
      fetchProducts();
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryName(product.categoryId).toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery, categories])

  const renderProductGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-8 px-4">
      {isLoading ? (
        <>
          <ProductGridSkeleton />
          <ProductGridSkeleton />
          <ProductGridSkeleton />
          <ProductGridSkeleton />
          <ProductGridSkeleton />
          <ProductGridSkeleton />
        </>
      ) : filteredProducts.length === 0 ? (
        <div className="col-span-full text-center py-4">
          <p>No products found</p>
        </div>
      ) : (
        filteredProducts.map((product: Product) => (
          <div key={product.id} className="group">
            <div className="relative aspect-square mb-3 bg-white rounded-lg overflow-hidden">
              <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-105">
                {product.coverImage ? (
                  <Image
                    src={getImageUrl(product.coverImage)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2  ">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => toggleProductSelection(product.id)}
                  className="bg-white border-gray-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-200 w-fit px-3 py-[1px] rounded-xl">
                <span className="text-xs text-slate-800">
                  {getCategoryName(product.categoryId)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 pl-3">
                <Link 
                  href={`/products/${product.id}/edit`}
                  className="flex-1 hover:underline"
                >
                  <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Products</h1>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">All products</span>
          </div>
          <Link href="/products/new">
            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" /> Create Product
            </Button>
          </Link>
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
 
            <div className="relative flex-grow max-w-xl">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-8 w-full border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedProducts}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-2 rounded-none",
                  viewMode === 'list' && "bg-muted"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-2 rounded-none",
                  viewMode === 'grid' && "bg-muted"
                )}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full ">
        {viewMode === 'list' ? (
          <Table className="w-full border-collapse table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] py-2 px-6 font-medium">
                  <Checkbox
                    checked={selectedProducts.length === products.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts(products.map(p => p.id))
                      } else {
                        setSelectedProducts([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-[120px] py-2 px-4 font-medium">Image</TableHead>
                <TableHead className="w-[250px] py-2 px-2 font-medium">Name</TableHead>
                <TableHead className="w-[150px] py-2 px-2 font-medium">Price</TableHead>
                <TableHead className="w-[150px] py-2 px-2 font-medium">Quantity</TableHead>
                <TableHead className="hidden md:table-cell w-[150px] py-2 px-2 font-medium">Category</TableHead>
                <TableHead className="w-[150px] py-2 px-2 font-medium">Status</TableHead>
                <TableHead className="w-[150px] py-2 px-2 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className=''>
              {isLoading ? (
                <>
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                  <ProductSkeleton />
                </>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <p>No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-2 px-6">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <div className="w-12 h-12 relative">
                        {product.coverImage ? (
                          <Image
                            src={getImageUrl(product.coverImage)}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2">{product.name}</TableCell>
                    <TableCell className="py-2 px-2">${product.price}</TableCell>
                    <TableCell className="py-2 px-2">{product.quantity}</TableCell>
                    <TableCell className="hidden md:table-cell py-2 px-2">{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell className="py-2 px-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        product.isArchived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      )}>
                        {product.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <Link href={`/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          renderProductGrid()
        )}
      </div>
    </div>
  )
}

