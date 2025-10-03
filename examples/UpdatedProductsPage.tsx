// EJEMPLO DE CÓMO USAR EL NUEVO SISTEMA DE PAGINACIÓN
// Este archivo muestra cómo actualizar páginas existentes

import React from 'react';
import { ProductsTable } from '@/components/ProductsTable';
import { useMainStore } from '@/stores/mainStore';

// Antes: La página de productos podría haber tenido su propia lógica de paginación
// Después: Simplemente usa el componente ProductsTable que maneja todo

export function UpdatedProductsPage() {
  const { currentStore } = useMainStore();

  if (!currentStore) {
    return <div>No hay tienda seleccionada</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="text-muted-foreground">
          Gestiona todos los productos de tu tienda
        </p>
      </div>

      {/* 
        ANTES: Aquí habría mucho código de paginación manual
        DESPUÉS: Solo necesitas pasar el storeId
      */}
      <ProductsTable storeId={currentStore.id} />
    </div>
  );
}

// ===================================================================
// EJEMPLO DE CÓMO CREAR UNA PÁGINA SIMILAR PARA OTROS RECURSOS
// ===================================================================

import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

// Ejemplo para OrdersTable
export function OrdersTable({ storeId }: { storeId: string }) {
  // Fetch function para órdenes
  const fetchOrders = async (params: any) => {
    const searchParams = new URLSearchParams();
    
    // Paginación
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    
    // Filtros específicos de órdenes
    if (params.financialStatus) searchParams.set('financialStatus', params.financialStatus);
    if (params.shippingStatus) searchParams.set('shippingStatus', params.shippingStatus);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const url = `/orders/${storeId}?${searchParams.toString()}`;
    const response = await apiClient.get(url);
    
    return {
      data: response.data.data || response.data.items || [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: response.data.total || response.data.count || 0,
        totalPages: response.data.totalPages || response.data.pages || 0,
        hasNext: response.data.hasNext || false,
        hasPrev: response.data.hasPrev || false
      }
    };
  };

  const {
    data: orders,
    loading,
    paginationState,
    onPageChange,
    onLimitChange,
    onSortChange,
    onSearch
  } = useDataTable(fetchOrders, { page: 1, limit: 20 });

  const columns: Column<any>[] = [
    {
      key: 'orderNumber',
      title: 'Número',
      sortable: true,
      render: (num: number) => `#${num}`
    },
    {
      key: 'customerEmail',
      title: 'Cliente',
      render: (email: string) => (
        <div>
          <p className="font-medium">{email}</p>
          <p className="text-sm text-muted-foreground">
            {/* Aquí podrías mostrar el nombre del cliente si está disponible */}
          </p>
        </div>
      )
    },
    {
      key: 'totalPrice',
      title: 'Total',
      sortable: true,
      render: (price: number) => (
        <span className="font-mono">${price?.toFixed(2)}</span>
      )
    },
    {
      key: 'financialStatus',
      title: 'Estado',
      render: (status: string) => (
        <Badge variant={
          status === 'PAID' ? 'default' : 
          status === 'PENDING' ? 'secondary' : 'destructive'
        }>
          {status}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'Fecha',
      sortable: true,
      render: (date: string) => (
        <span className="text-sm">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    }
  ];

  const filterOptions = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Estado financiero:</label>
        <Select onValueChange={(value) => onSearch('')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="PAID">Pagado</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="FAILED">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <DataTable
      data={orders}
      columns={columns}
      pagination={paginationState}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      onSortChange={onSortChange}
      showFilters={true}
      filterOptions={filterOptions}
      searchPlaceholder="Buscar órdenes..."
      emptyMessage="No se encontraron órdenes"
    />
  );
}

// ===================================================================
// EJEMPLO DE USO MÁS SIMPLE PARA RECURSOS QUE NO NECESITAN TABLA
// ===================================================================

import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';

export function SimpleCollectionsList({ storeId }: { storeId: string }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  const paginationHook = usePagination({
    initialLimit: 12, // Para mostrar como grid
    onPageChange: async (params) => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/collections/${storeId}?page=${params.page}&limit=${params.limit}`);
        setCollections(response.data.data || []);
        paginationHook.updatePaginationFromResponse(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="space-y-4">
      {/* Grid de colecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="p-4">
            <h3 className="font-medium">{collection.title}</h3>
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          </Card>
        ))}
      </div>

      {/* Controles de paginación */}
      <PaginationControls
        paginationState={paginationHook.paginationState}
        onPageChange={paginationHook.goToPage}
        onLimitChange={paginationHook.changeItemsPerPage}
      />
    </div>
  );
}
