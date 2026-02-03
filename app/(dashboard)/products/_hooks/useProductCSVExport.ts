"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { fetchAllProductsByStore } from "@/hooks/useProducts"
import { CSVExportConfig } from "@/types/csv-export"
import { CSVService } from "@/lib/csv/csv-service"
import {
  formatProductsAsProducts,
  formatProductsAsVariants,
  getProductHeaders,
  getVariantHeaders,
} from "@/lib/csv/formatters/product-csv-formatter"
import { useStores } from "@/hooks/useStores"

export function useProductCSVExport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { currentStoreId } = useStores()

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  const handleExport = async (
    config: CSVExportConfig,
    searchTerm: string,
    selectedVendors: string[],
    selectedCategories: string[]
  ) => {
    if (!currentStoreId) {
      toast({ variant: "destructive", title: "Error", description: "No hay tienda seleccionada" })
      return
    }
    setIsExporting(true)
    try {
      const allProducts = await fetchAllProductsByStore(currentStoreId, {
        query: searchTerm || undefined,
        vendor: selectedVendors.length ? selectedVendors : undefined,
        categorySlugs: selectedCategories.length ? selectedCategories : undefined,
      })
      if (!allProducts.length) {
        toast({
          variant: "destructive",
          title: "Sin datos",
          description: "No hay productos para exportar con los filtros aplicados",
        })
        return
      }
      const isDetailed = config.format === "detailed"
      const formattedData = isDetailed
        ? formatProductsAsVariants(allProducts)
        : formatProductsAsProducts(allProducts)
      const headers = isDetailed ? getVariantHeaders(allProducts) : getProductHeaders(allProducts)
      const baseFilename = config.filename ?? (isDetailed ? "productos-variantes" : "productos")
      CSVService.exportToCSV(formattedData, headers, baseFilename)
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${formattedData.length} ${isDetailed ? "variantes" : "productos"} correctamente`,
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

  return { isDialogOpen, isExporting, openDialog, closeDialog, handleExport }
}

