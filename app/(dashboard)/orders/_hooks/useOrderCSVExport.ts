"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { fetchOrdersByStore } from "@/hooks/useOrders"
import { CSVExportConfig } from "@/types/csv-export"
import { CSVService } from "@/lib/csv/csv-service"
import { 
  formatOrdersAsSummary, 
  formatOrdersAsItems,
  ORDER_SUMMARY_HEADERS,
  ORDER_ITEMS_HEADERS 
} from "@/lib/csv/formatters/order-csv-formatter"

export function useOrderCSVExport() {
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
    filters?: {
      financialStatus?: string
      fulfillmentStatus?: string
      paymentStatus?: string
      shippingStatus?: string
      startDate?: string
      endDate?: string
    }
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
      // Construir parámetros de búsqueda basados en los filtros actuales
      const baseParams: any = {
        limit: 100, // Máximo permitido por el backend
      }

      if (searchTerm) {
        baseParams.query = searchTerm
      }

      // Agregar filtros de estado si existen
      if (filters?.financialStatus) {
        baseParams.financialStatus = filters.financialStatus
      }
      if (filters?.fulfillmentStatus) {
        baseParams.fulfillmentStatus = filters.fulfillmentStatus
      }
      if (filters?.paymentStatus) {
        baseParams.paymentStatus = filters.paymentStatus
      }
      if (filters?.shippingStatus) {
        baseParams.shippingStatus = filters.shippingStatus
      }
      if (filters?.startDate) {
        baseParams.startDate = filters.startDate
      }
      if (filters?.endDate) {
        baseParams.endDate = filters.endDate
      }

      // Obtener todas las órdenes paginadas
      let allOrders: any[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const params = { ...baseParams, page: currentPage }
        const response = await fetchOrdersByStore(currentStoreId, params)
        const ordersData = response.data || []
        
        allOrders = [...allOrders, ...ordersData]
        
        // Verificar si hay más páginas
        hasMore = response.meta?.hasNext ?? response.meta?.hasNextPage ?? false
        currentPage++
        
        // Límite de seguridad para evitar loops infinitos
        if (currentPage > 1000) {
          console.warn('Se alcanzó el límite de páginas (1000)')
          break
        }
      }

      if (allOrders.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin datos",
          description: "No hay órdenes para exportar con los filtros aplicados",
        })
        setIsExporting(false)
        return
      }

      // Formatear datos según el tipo seleccionado
      let formattedData: any[]
      let headers: Array<{ key: string; label: string }>
      let baseFilename: string

      if (config.format === 'detailed') {
        // Exportar por items
        formattedData = formatOrdersAsItems(allOrders)
        headers = ORDER_ITEMS_HEADERS
        baseFilename = config.filename || 'ordenes-detalle'
      } else {
        // Exportar resumen
        formattedData = formatOrdersAsSummary(allOrders)
        headers = ORDER_SUMMARY_HEADERS
        baseFilename = config.filename || 'ordenes'
      }

      // Generar y descargar CSV
      CSVService.exportToCSV(formattedData, headers, baseFilename)

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${formattedData.length} ${config.format === 'detailed' ? 'items' : 'órdenes'} correctamente`,
      })

      closeDialog()
    } catch (error) {
      console.error("Error al exportar órdenes:", error)
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

