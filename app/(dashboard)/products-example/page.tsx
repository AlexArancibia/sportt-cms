'use client'

import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { usePagination } from '@/hooks/use-pagination'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Product } from '@/types/product'

export default function ProductsExamplePage() {
  const { 
    products, 
    productsPagination,
    currentStore, 
    fetchProductsByStore,
    loading 
  } = useMainStore()

  const pagination = usePagination()
  const [searchQuery, setSearchQuery] = useState('')

  // Loading de productos cuando cambian los parámetros de paginación
  useEffect(() => {
    if (!currentStore) return

    const loadProducts = async () => {
      try {
        await fetchProductsByStore(currentStore, {
          page: pagination.params.page,
          limit: pagination.params.limit,
          sortBy: pagination.params.sortBy,
          sortOrder: pagination.params.sortOrder,
          ...(searchQuery && { query: searchQuery })
        })
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }

    loadProducts()
  }, [currentStore, pagination.params, searchQuery, fetchProductsByStore])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // El useEffect ya maneja el search automáticamente
  }

  if (!currentStore) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-500">
          No hay store seleccionado. Selecciona una store para ver los productos.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ejemplo de Paginación - Productos</h1>
          <p className="text-gray-600">Store: {currentStore}</p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Producto
          </Button>
        </Link>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Información de paginación */}
      {productsPagination && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Información de Paginación:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Página actual:</strong> {productsPagination.pagination.page}
            </div>
            <div>
              <strong>Por página:</strong> {productsPagination.pagination.limit}
            </div>
            <div>
              <strong>Total productos:</strong> {productsPagination.pagination.total}
            </div>
            <div>
              <strong>Total páginas:</strong> {productsPagination.pagination.totalPages}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando productos...</span>
        </div>
      )}

      {/* Tabla de productos */}
      {products && (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Variantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.id}</TableCell>
                  <TableCell className="font-semibold">{product.title}</TableCell>
                  <TableCell className="text-gray-600">{product.slug}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.variants?.length || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Componente de paginación */}
      {productsPagination && productsPagination.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={productsPagination.pagination.page}
            totalPages={productsPagination.pagination.totalPages}
            onPageChange={(page) => pagination.setPage(page)}
            currentLimit={pagination.params.limit || 20}
            onLimitChange={(limit) => pagination.setLimit(limit)}
          />
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Cómo usar esta página:</h3>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
          <li>Los productos se cargan automáticamente al cambiar página o límite</li>
          <li>Usa la búsqueda para filtrar productos por título</li>
          <li>El componente Pagination permite cambiar página y elementos por página</li>
          <li>Los datos se recargan desde cero en cada cambio de parámetros</li>
          <li>La información de paginación muestra totales y contexto actual</li>
        </ul>
      </div>
    </div>
  )
}