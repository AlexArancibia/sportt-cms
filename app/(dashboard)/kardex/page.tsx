"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { KardexFilters } from "./_components/KardexFilters"
import { KardexGrid } from "./_components/KardexGrid"
import { KardexStats } from "./_components/KardexStats"
import type { KardexFilters as KardexFiltersType, ValuationMethod } from "@/types/kardex"
import { useMemo } from "react"
import apiClient from "@/lib/axiosConfig"
import type { Category } from "@/types/category"

const FETCH_COOLDOWN_MS = 1000 // 1 segundo
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export default function KardexPage() {
  const { 
    kardex, 
    kardexPagination, 
    currentStore, 
    fetchKardex, 
    loading,
  } = useMainStore()
  const { toast } = useToast()
  
  const [filters, setFilters] = useState<KardexFiltersType>({
    page: 1,
    limit: 20,
    valuationMethod: 'WEIGHTED_AVERAGE',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const fetchAttemptsRef = useRef<number>(0)
  const hasShownErrorRef = useRef<boolean>(false)

  // Get unique categories from products (fallback)
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set<string>()
    kardex.forEach((item) => {
      item.product.categories.forEach((cat) => categorySet.add(cat))
    })
    return Array.from(categorySet).sort()
  }, [kardex])

  // Load categories for filter from API
  useEffect(() => {
    const loadCategoriesForFilter = async () => {
      if (!currentStore) return

      try {
        const url = `/categories/${currentStore}?limit=100&page=1`
        const response = await apiClient.get<{ data: Category[]; pagination: any }>(url)
        
        if (response.data?.data) {
          // Extract category names from the response
          const categoryNames = response.data.data.map((cat: Category) => cat.name).sort()
          setFilterCategories(categoryNames)
        }
      } catch (error) {
        console.error("Error loading categories for filter:", error)
        // Fallback to unique categories from products if API fails
        setFilterCategories(uniqueCategories)
      }
    }

    loadCategoriesForFilter()
  }, [currentStore, uniqueCategories])

  // Cargar datos cuando se obtiene el store o cambian los filtros
  useEffect(() => {
    if (!currentStore) {
      setIsLoading(false)
      return
    }

    // Limpiar cualquier timeout pendiente
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    // Resetear contadores cuando cambian los filtros
    fetchAttemptsRef.current = 0
    hasShownErrorRef.current = false

    const loadData = async () => {
      // Evitar fetches duplicados o muy frecuentes
      const now = Date.now()
      if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
        console.log("Tiempo de espera activo, usando datos en caché")
        return
      }

      setIsLoading(true)
      lastFetchTimeRef.current = now

      try {
        console.log(`Cargando kardex (intento ${fetchAttemptsRef.current + 1})`)
        await fetchKardex(currentStore, filters)

        // Restablecer los contadores de reintento
        fetchAttemptsRef.current = 0
        hasShownErrorRef.current = false
      } catch (error: any) {
        console.error("Error al cargar kardex:", error)

        // Verificar si es un error de conexión
        const isConnectionError = 
          error?.code === 'ERR_NETWORK' || 
          error?.message?.includes('Network Error') ||
          error?.message?.includes('ERR_CONNECTION_REFUSED')

        // Verificar si es un error HTTP 4xx (errores del cliente - permanentes, no reintentar)
        const httpStatus = error?.response?.status
        const isClientError = httpStatus && httpStatus >= 400 && httpStatus < 500

        // Si es un error de conexión o un error 4xx, no reintentar automáticamente
        if (isConnectionError || isClientError) {
          setIsLoading(false)
          if (!hasShownErrorRef.current) {
            hasShownErrorRef.current = true
            
            let title = "Error"
            let description = "No se pudieron cargar los datos del kardex."

            if (isConnectionError) {
              title = "Error de conexión"
              description = "No se pudo conectar con el servidor. Verifique que el backend esté corriendo."
            } else if (httpStatus === 404) {
              title = "Endpoint no encontrado"
              description = "El endpoint de kardex no está disponible en el backend. Verifique que la ruta /kardex/{storeId}/general esté implementada."
            } else if (httpStatus === 401 || httpStatus === 403) {
              title = "Error de autorización"
              description = "No tiene permisos para acceder a los datos de kardex."
            } else if (isClientError) {
              title = `Error ${httpStatus}`
              description = error?.response?.data?.message || "Error al procesar la solicitud."
            }

            toast({
              variant: "destructive",
              title,
              description,
            })
          }
          return
        }

        // Para errores 5xx (errores del servidor - pueden ser transitorios), implementar reintento con backoff exponencial
        if (fetchAttemptsRef.current < MAX_RETRIES) {
          const nextAttempt = fetchAttemptsRef.current + 1
          const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1)

          console.log(`Reintentando carga en ${delay}ms (intento ${nextAttempt}/${MAX_RETRIES})`)

          fetchAttemptsRef.current = nextAttempt
          fetchTimeoutRef.current = setTimeout(() => {
            loadData()
          }, delay)
        } else {
          setIsLoading(false)
          fetchAttemptsRef.current = 0
          if (!hasShownErrorRef.current) {
            hasShownErrorRef.current = true
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "No se pudieron cargar los datos del kardex después de varios intentos. Por favor, inténtelo de nuevo.",
            })
          }
        }
        return
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Cleanup
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
  }, [currentStore, filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.valuationMethod, filters.search, filters.startDate, filters.endDate, filters.category?.join(','), filters.movementType?.join(','), fetchKardex, toast])

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage })
  }

  const handleFiltersChange = (newFilters: KardexFiltersType) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting kardex data with filters:', filters)
    toast({
      title: "Exportar",
      description: "Función de exportación próximamente disponible",
    })
  }

  if (!currentStore) {
    return (
      <div className="container mx-auto px-4 py-6">
        <HeaderBar title="Sistema de Kardex" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No hay tienda seleccionada
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, seleccione una tienda desde el menú lateral
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <HeaderBar title="Sistema de Kardex" />
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Overview */}
      <KardexStats filters={filters} storeId={currentStore} />

      {/* Filters */}
      <KardexFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
        categories={filterCategories.length > 0 ? filterCategories : uniqueCategories}
      />

      {/* Product Grid */}
      <KardexGrid 
        products={kardex}
        pagination={kardexPagination}
        loading={isLoading || loading}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

