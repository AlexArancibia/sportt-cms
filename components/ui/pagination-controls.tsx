import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationState } from '@/types/pagination';

interface PaginationControlsProps {
  paginationState: PaginationState;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPageSelector?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}

export function PaginationControls({
  paginationState,
  onPageChange,
  onLimitChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPageSelector = true,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className = ''
}: PaginationControlsProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage, hasNext, hasPrev, isLoading } = paginationState;

  // Calcular páginas a mostrar numéricamente
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    const end = Math.min(totalPages, start + maxPageNumbers - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Información de items */}
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} elementos
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Navegación primera página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPrev || isLoading}
          className="px-2"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Navegación página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev || isLoading}
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Números de página */}
        {showPageNumbers && getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className="px-3"
          >
            {page}
          </Button>
        ))}

        {/* Navegación página siguiente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext || isLoading}
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Navegación última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext || isLoading}
          className="px-2"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selector de elementos por página */}
      {showItemsPerPageSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Componente más compacto para espacios reducidos
export function CompactPagination({
  paginationState,
  onPageChange,
  onLimitChange,
  className = ''
}: Omit<PaginationControlsProps, 'showPageNumbers' | 'maxPageNumbers'>) {
  return (
    <PaginationControls
      {...arguments[0]}
      showPageNumbers={false}
      maxPageNumbers={0}
      className={className}
    />
  );
}
