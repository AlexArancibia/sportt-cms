"use client"

import { useEffect, useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/Pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/types/product"

export default function PaginatedProductsList() {
  const { 
    products, 
    productsPagination, 
    currentStore, 
    fetchProductsByStore, 
    loading 
  } = useMainStore()
  
  const { params, setPage, setLimit, setSortBy } = usePagination()
  const [searchTerm, setSearchTerm] = useState("")

  // Load products when store or pagination params change
  useEffect(() => {
    if (currentStore) {
      fetchProductsByStore(currentStore, params)
    }
  }, [currentStore, params, fetchProductsByStore])

  const renderProducts = () => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando productos...</p>
        </div>
      )
    }

    if (!products || products.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-600">No hay productos disponibles</p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha de creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell>{product.description || '-'}</TableCell>
              <TableCell>{product.status}</TableCell>
              <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link href="/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Producto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Sort By */}
        <select 
          value={params.sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="createdAt">Fecha de creación</option>
          <option value="title">Nombre</option>
          <option value="updatedAt">Fecha de actualización</option>
        </select>
      </div>

      {/* Products Table */}
      {renderProducts()}

      {/* Pagination */}
      <Pagination
        pagination={productsPagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}

