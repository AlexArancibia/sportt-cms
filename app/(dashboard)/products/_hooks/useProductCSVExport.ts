"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/axiosConfig"
import { CSVExportConfig } from "@/types/csv-export"
import { CSVService } from "@/lib/csv/csv-service"
import { 
  formatProductsAsProducts, 
  formatProductsAsVariants,
  getProductHeaders,
  getVariantHeaders
} from "@/lib/csv/formatters/product-csv-formatter"
import { useStores } from "@/hooks/useStores"
import type { PaginatedProductsResponse, Product, ProductSearchParams } from "@/types/product"

async function fetchProductsByStore(
  storeId: string,
  params?: ProductSearchParams,
): Promise<PaginatedProductsResponse> {
  const queryParams = new URLSearchParams()
  queryParams.append("page", String(params?.page || 1))
  queryParams.append("limit", String(params?.limit || 20))
  queryParams.append("sortBy", params?.sortBy || "createdAt")
  queryParams.append("sortOrder", params?.sortOrder || "desc")

  if (params?.query) queryParams.append("query", params.query)
  if (params?.vendor && params.vendor.length > 0) {
    params.vendor.forEach((v) => queryParams.append("vendor", v))
  }
  params?.categorySlugs?.forEach((slug) => queryParams.append("categorySlugs", slug))

  const url = `/products/${storeId}?${queryParams.toString()}`
  const response = await apiClient.get<PaginatedProductsResponse>(url)

  if (!response.data?.data || !response.data?.pagination) {
    throw new Error("Invalid API response structure")
  }

  return response.data
}

export function useProductCSVExport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { currentStoreId } = useStores()

  const openDialog = () => {
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

  const handleExport = async (
    config: CSVExportConfig,
    searchTerm: string,
    selectedVendors: string[],
    selectedCategories: string[]
  ) => {
    if (!currentStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada",
      })
      return
    }

    setIsExporting(true)

    try {
      // Obtener todos los productos paginados
      const allProducts: Product[] = []
      let currentPage = 1
      let hasMore = true
      const limitPerPage = 100 // Máximo permitido por el backend

      while (hasMore) {
        const response = await fetchProductsByStore(currentStoreId, {
          page: currentPage,
          limit: limitPerPage,
          query: searchTerm || undefined,
          vendor: selectedVendors.length > 0 ? selectedVendors : undefined,
          categorySlugs: selectedCategories.length > 0 ? selectedCategories : undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        })

        const productsData = response.data || []
        
        allProducts.push(...productsData)
        
        // Verificar si hay más páginas
        hasMore = Boolean(response.pagination?.hasNext) && productsData.length === limitPerPage
        currentPage++
        
        // Límite de seguridad para evitar loops infinitos
        if (currentPage > 1000) {
          console.warn('Se alcanzó el límite de páginas (1000)')
          break
        }
      }

      if (allProducts.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin datos",
          description: "No hay productos para exportar con los filtros aplicados",
        })
        setIsExporting(false)
        return
      }

      // Formatear datos según el tipo seleccionado
      let formattedData: any[]
      let headers: Array<{ key: string; label: string }>
      let baseFilename: string

      if (config.format === 'detailed') {
        // Exportar por variante
        formattedData = formatProductsAsVariants(allProducts)
        headers = getVariantHeaders(allProducts)
        baseFilename = config.filename || 'productos-variantes'
      } else {
        // Exportar por producto
        formattedData = formatProductsAsProducts(allProducts)
        headers = getProductHeaders(allProducts)
        baseFilename = config.filename || 'productos'
      }

      // Generar y descargar CSV
      CSVService.exportToCSV(formattedData, headers, baseFilename)

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${formattedData.length} ${config.format === 'detailed' ? 'variantes' : 'productos'} correctamente`,
      })

      closeDialog()
    } catch (error) {
      console.error("Error al exportar productos:", error)
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: "No se pudo generar el archivo CSV. Por favor, intente de nuevo.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isDialogOpen,
    isExporting,
    openDialog,
    closeDialog,
    handleExport,
  }
}

