import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ProductSearchParams } from '@/types/pagination';
import { useMainStore } from '@/stores/mainStore';
import { Product } from '@/types/product';
import { ProductStatus } from '@/types/common';
import { formatPrice } from '@/lib/utils';
import { Package } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

export function ProductsTable({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const { fetchProductsPaginated, shopSettings } = useMainStore();

  const {
    paginationState,
    getPaginationParams,
    goToPage,
    changeItemsPerPage,
    updatePaginationFromResponse,
    setLoading: setPaginationLoading,
  } = usePagination({ 
    initialLimit: 20, 
    initialSortBy: 'createdAt', 
    initialSortOrder: 'desc'
  });

  // Declarar loadProducts después de tener paginationState
  const loadProducts = useCallback(async () => {
    console.log('🔄 Loading products...', {
      storeId,
      currentPage: paginationState.currentPage,
      itemsPerPage: paginationState.itemsPerPage,
      searchQuery,
      statusFilter
    });

    setLoading(true);
    setError(null);

    try {
      const baseParams = getPaginationParams();
      const params: ProductSearchParams = {
        ...baseParams,
        query: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
      };

      console.log('📡 API Request params:', params);
      const response = await fetchProductsPaginated(storeId, params);
      
      console.log('📦 API Response:', {
        dataCount: response.data?.length,
        pagination: response.pagination
      });

      setProducts(response.data);
      updatePaginationFromResponse(response);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [storeId, searchQuery, statusFilter, paginationState, fetchProductsPaginated, getPaginationParams, updatePaginationFromResponse, setPaginationLoading]);

  // Cargar productos cuando cambian los parámetros
  useEffect(() => {
    if (storeId) {
      loadProducts();
    }
  }, [storeId, paginationState.currentPage, paginationState.itemsPerPage, searchQuery, statusFilter]);

  // Manejar filtros
  const handleStatusChange = (status: string, checked: boolean) => {
    let newStatus = [...statusFilter];
    if (checked) {
      newStatus.push(status);
    } else {
      newStatus = newStatus.filter(s => s !== status);
    }
    setStatusFilter(newStatus);
  };

  // Función helper para renderizar el precio (mejorada para evitar errores)
  const renderPrice = (product: Product) => {
    try {
      if (!product.variants || product.variants.length === 0) return "-";

      const defaultCurrencyId = shopSettings[0]?.defaultCurrencyId;
      if (!defaultCurrencyId) return "-";

      const variantPrices = product.variants
        .flatMap((variant) => variant.prices || [])
        .filter((price) => price.currencyId === defaultCurrencyId)
        .map((price) => price.price);

      if (variantPrices.length === 0) return "-";

      const minPrice = Math.min(...variantPrices);
      const maxPrice = Math.max(...variantPrices);
      const currency = product.variants[0]?.prices?.[0]?.currency;

      if (!currency) return "-";

      return minPrice === maxPrice
        ? formatPrice(minPrice, currency)
        : `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`;
    } catch (error) {
      console.warn('Error rendering price for product:', product.id, error);
      return "-";
    }
  };

  // Función helper para renderizar el inventario
  const renderInventory = (product: Product) => {
    if (!product.variants) return <span className="text-gray-500 text-sm">Sin stock</span>;

    const totalInventory = product.variants.reduce((total, variant) => total + (variant.inventoryQuantity || 0), 0);

    if (totalInventory <= 0) {
      return <span className="text-yellow-600 text-sm">Sin stock</span>;
    } else if (totalInventory < 5) {
      return <span className="text-orange-600 text-sm">{totalInventory} disponibles</span>;
    } else {
      return <span className="text-emerald-600 text-sm">{totalInventory} disponibles</span>;
    }
  };

  // Función helper para renderizar el estado
  const renderStatus = (product: Product) => {
    const status = product.status;

    switch (status) {
      case ProductStatus.DRAFT:
        return <Badge variant="secondary">Borrador</Badge>;
      case ProductStatus.ACTIVE:
        return <Badge variant="default">Activo</Badge>;
      case ProductStatus.ARCHIVED:
        return <Badge variant="outline">Archivado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  // Indicador de carga
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Cargando productos...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <p>Error al cargar productos: {error}</p>
          <Button onClick={loadProducts} className="mt-2">
            Intentar de nuevo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Barra de herramientas */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-4">
            {[
              { value: ProductStatus.ACTIVE, label: 'Activo' },
              { value: ProductStatus.DRAFT, label: 'Borrador' },
              { value: ProductStatus.ARCHIVED, label: 'Archivado' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-2">
                <Checkbox
                  checked={statusFilter.includes(value)}
                  onCheckedChange={(checked) => 
                    handleStatusChange(value, checked as boolean)
                  }
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Producto</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Colecciones</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Precio</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Inventario</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrls && product.imageUrls[0] ? (
                        <img 
                          src={product.imageUrls[0]} 
                          alt={product.title}
                          className="w-10 h-10 rounded object-cover bg-gray-50"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-gray-500">SKU: {product.variants?.[0]?.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{product.collections?.[0]?.title || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{renderPrice(product)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {renderInventory(product)}
                  </td>
                  <td className="px-4 py-3">
                    {renderStatus(product)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {products.length > 0 && (
        <div className="p-4 border-t">
          <PaginationControls
            paginationState={paginationState}
            onPageChange={goToPage}
            onLimitChange={changeItemsPerPage}
          />
        </div>
      )}
    </Card>
  );
}