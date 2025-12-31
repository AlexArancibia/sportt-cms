"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { CSVExportConfig } from "@/types/csv-export"
import { CSVService } from "@/lib/csv/csv-service"
import { 
  formatProductsAsProducts, 
  formatProductsAsVariants,
  getProductHeaders,
  getVariantHeaders
} from "@/lib/csv/formatters/product-csv-formatter"
import { Product } from "@/types/product"

export function useProductCSVExport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { fetchProductsByStore, currentStore } = useMainStore()

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
    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada",
      })
      return
    }

    setIsExporting(true)

    try {
      // Construir parámetros de búsqueda basados en los filtros actuales
      const baseParams: any = {
        limit: 100, // Máximo permitido por el backend
      }

      if (searchTerm) {
        baseParams.search = searchTerm
      }

      if (selectedVendors.length > 0) {
        baseParams.vendor = selectedVendors.join(',')
      }

      if (selectedCategories.length > 0) {
        baseParams.category = selectedCategories.join(',')
      }

      // Obtener todos los productos paginados
      let allProducts: any[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const params = { ...baseParams, page: currentPage }
        const response = await fetchProductsByStore(currentStore, params)
        const productsData = response.data || []
        
        allProducts = [...allProducts, ...productsData]
        
        // Verificar si hay más páginas
        hasMore = response.pagination?.hasNext || false
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

