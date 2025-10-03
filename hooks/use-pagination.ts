import { useState, useCallback, useEffect } from 'react';
import { PaginationState, PaginationParams, PaginatedResponse } from '@/types/pagination';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  onPageChange?: (params: PaginationParams) => void;
  autoFetch?: () => Promise<void>; // Opcional: función para volver a hacer fetch cuando cambian los parámetros
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSortBy = 'createdAt',
    initialSortOrder = 'desc',
    onPageChange,
    autoFetch
  } = options;

  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: initialLimit,
    hasNext: false,
    hasPrev: false,
    isLoading: false
  });

  const [sortState, setSortState] = useState({
    sortBy: initialSortBy,
    sortOrder: initialSortOrder
  });

  // Función para actualizar el estado de paginación basado en la respuesta del servidor
  const updatePaginationFromResponse = useCallback((response: PaginatedResponse<any>) => {
    console.log('🔄 updatePaginationFromResponse called with:', response.pagination);
    
    setPaginationState(prev => {
      const newState = {
        ...prev,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.total,
        itemsPerPage: response.pagination.limit,
        hasNext: response.pagination.hasNext,
        hasPrev: response.pagination.hasPrev,
        currentPage: response.pagination.page,
        isLoading: false
      };
      
      console.log('📊 Updating pagination state:', {
        oldItemsPerPage: prev.itemsPerPage,
        newItemsPerPage: response.pagination.limit,
        newState
      });
      
      return newState;
    });
  }, []);

  // Función para construir parámetros de paginación
  const getPaginationParams = useCallback((): PaginationParams => ({
    page: paginationState.currentPage,
    limit: paginationState.itemsPerPage,
    sortBy: sortState.sortBy,
    sortOrder: sortState.sortOrder
  }), [paginationState.currentPage, paginationState.itemsPerPage, sortState]);

  // Funciones de navegación
  const goToPage = useCallback((page: number) => {
    console.log('🔢 goToPage called with:', { 
      requestedPage: page, 
      currentPage: paginationState.currentPage,
      totalPages: paginationState.totalPages,
      isLoading: paginationState.isLoading
    });
    
    if (page >= 1 && page <= paginationState.totalPages && !paginationState.isLoading) {
      console.log('✅ Valid page change, updating state...');
      setPaginationState(prev => ({ ...prev, currentPage: page, isLoading: true }));
      
      const params = getPaginationParams();
      console.log('📤 Calling onPageChange with:', { ...params, page });
      onPageChange?.({ ...params, page });
      
      console.log('🔄 Triggering autoFetch...');
      autoFetch?.();
    } else {
      console.warn('❌ Invalid page change ignored:', {
        page,
        totalPages: paginationState.totalPages,
        isLoading: paginationState.isLoading
      });
    }
  }, [paginationState.totalPages, paginationState.isLoading, paginationState.currentPage, getPaginationParams, onPageChange, autoFetch]);

  const nextPage = useCallback(() => {
    if (paginationState.hasNext && !paginationState.isLoading) {
      goToPage(paginationState.currentPage + 1);
    }
  }, [paginationState.hasNext, paginationState.currentPage, paginationState.isLoading, goToPage]);

  const prevPage = useCallback(() => {
    if (paginationState.hasPrev && !paginationState.isLoading) {
      goToPage(paginationState.currentPage - 1);
    }
  }, [paginationState.hasPrev, paginationState.currentPage, paginationState.isLoading, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(paginationState.totalPages);
  }, [goToPage, paginationState.totalPages]);

  const changeItemsPerPage = useCallback((newLimit: number) => {
    console.log('📊 changeItemsPerPage called with:', { 
      newLimit, 
      currentLimit: paginationState.itemsPerPage,
      isLoading: paginationState.isLoading
    });
    
    console.log('✅ Updating items per page...');
    setPaginationState(prev => ({ 
      ...prev, 
      itemsPerPage: newLimit, 
      currentPage: 1, // Reset to first page when changing limit
      isLoading: true 
    }));
    
    const params = getPaginationParams();
    console.log('📤 Calling onPageChange with:', { ...params, limit: newLimit, page: 1 });
    onPageChange?.({ ...params, limit: newLimit, page: 1 });
    
    console.log('🔄 Triggering autoFetch...');
    autoFetch?.();
  }, [getPaginationParams, onPageChange, autoFetch, paginationState.itemsPerPage, paginationState.isLoading]);

  const changeSorting = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortState({ sortBy: newSortBy, sortOrder: newSortOrder });
    setPaginationState(prev => ({ ...prev, currentPage: 1, isLoading: true }));
    const params = getPaginationParams();
    onPageChange?.({ ...params, sortBy: newSortBy, sortOrder: newSortOrder, page: 1 });
    autoFetch?.();
  }, [getPaginationParams, onPageChange, autoFetch]);

  const setLoading = useCallback((loading: boolean) => {
    setPaginationState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Reset cuando cambian los filtros (externos)
  const resetToFirstPage = useCallback(() => {
    setPaginationState(prev => ({ ...prev, currentPage: 1, isLoading: true }));
    const params = getPaginationParams();
    onPageChange?.({ ...params, page: 1 });
    autoFetch?.();
  }, [getPaginationParams, onPageChange, autoFetch]);

  return {
    // Estado
    paginationState,
    sortState,
    
    // Parámetros
    getPaginationParams,
    
    // Navegación
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    
    // Configuración
    changeItemsPerPage,
    changeSorting,
    
    // Utilidades
    updatePaginationFromResponse,
    setLoading,
    resetToFirstPage
  };
}