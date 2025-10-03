import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from './pagination-controls';
import { usePagination } from '@/hooks/use-pagination';
import { PaginationParams } from '@/types/pagination';
import { Search, Filter } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
    isLoading: boolean;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  loading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
  filterOptions?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onLimitChange,
  onSortChange,
  searchable = true,
  searchPlaceholder = "Buscar...",
  onSearch,
  searchValue = "",
  loading = false,
  emptyMessage = "No hay datos disponibles",
  showFilters = false,
  filterOptions,
  className = ""
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortChange) return;
    const sortBy = String(column.key);
    // Alternar entre asc y desc si es la misma columna
    onSortChange(sortBy, 'desc'); // Simplificado por ahora
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Cargando datos...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de herramientas */}
      {(searchable || showFilters) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Búsqueda */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          )}
        </div>
      )}

      {/* Panel de filtros expandible */}
      {showFilters && isFilterVisible && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium">Filtros</h4>
            {filterOptions}
          </div>
        </Card>
      )}

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground ${
                      column.sortable ? 'cursor-pointer hover:text-foreground' : ''
                    } ${column.className || ''}`}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      {column.title}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <div className="h-2 w-2">▲</div>
                          <div className="h-2 w-2">▼</div>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-3 text-sm ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginación */}
      {pagination && (
        <PaginationControls
          paginationState={pagination}
          onPageChange={onPageChange || (() => {})}
          onLimitChange={onLimitChange || (() => {})}
        />
      )}
    </div>
  );
}

// Hook auxiliar para usar con el DataTable
export function useDataTable<T>(
  fetchFunction: (params: PaginationParams) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>,
  initialParams: PaginationParams = {}
) {
  const paginationHook = usePagination({
    initialPage: initialParams.page || 1,
    initialLimit: initialParams.limit || 20,
    initialSortBy: initialParams.sortBy || 'createdAt',
    initialSortOrder: initialParams.sortOrder || 'desc'
  });

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (params: PaginationParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFunction(params);
      setData(response.data);
      paginationHook.updatePaginationFromResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const params = paginationHook.getPaginationParams();
    fetchData({ ...params, page });
  };

  const handleLimitChange = (limit: number) => {
    const params = paginationHook.getPaginationParams();
    fetchData({ ...params, limit, page: 1 });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const params = paginationHook.getPaginationParams();
    fetchData({ ...params, sortBy, sortOrder, page: 1 });
  };

  const handleSearch = (query: string) => {
    const params = paginationHook.getPaginationParams();
    fetchData({ ...params, query, page: 1 });
  };

  return {
    data,
    loading,
    error,
    paginationState: paginationHook.paginationState,
    sortState: paginationHook.sortState,
    onPageChange: handlePageChange,
    onLimitChange: handleLimitChange,
    onSortChange: handleSortChange,
    onSearch: handleSearch,
    refreshData: () => {
      const params = paginationHook.getPaginationParams();
      fetchData(params);
    }
  };
}
