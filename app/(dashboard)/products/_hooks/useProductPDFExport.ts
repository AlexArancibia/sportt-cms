"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { fetchAllProductsByStore } from "@/hooks/useProducts"
import { PDFExportConfig } from "@/types/pdf-export"
import { PDFService } from "@/lib/pdf/pdf-service"
import { useStores } from "@/hooks/useStores"
import { useShopSettings } from "@/hooks/useShopSettings"

const PRINT_LOADING_HTML = `<!DOCTYPE html><html><head><title>Cargando catálogo...</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}.loader{text-align:center}.spinner{border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"><div class="spinner"></div><p>Cargando productos...</p></div></body></html>`

export function useProductPDFExport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: currentShopSettings } = useShopSettings(currentStoreId)

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  const handleGeneratePDF = async (
    designConfig: PDFExportConfig,
    searchTerm: string,
    selectedVendors: string[],
    selectedCategories: string[]
  ) => {
    if (!currentStoreId) {
      toast({ variant: "destructive", title: "Error", description: "No se ha seleccionado una tienda" })
      return
    }
    if (!currentShopSettings) {
      toast({ variant: "destructive", title: "Error", description: "No se encontró la configuración de la tienda" })
      return
    }
    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow || printWindow.closed) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo abrir la ventana. Permite ventanas emergentes.",
      })
      return
    }
    printWindow.document.write(PRINT_LOADING_HTML)
    printWindow.document.close()

    setIsExporting(true)
    try {
      const allProducts = await fetchAllProductsByStore(currentStoreId, {
        query: searchTerm || undefined,
        vendor: selectedVendors.length ? selectedVendors : undefined,
        categorySlugs: selectedCategories.length ? selectedCategories : undefined,
      })
      const currencyId = designConfig.currencyId ?? currentShopSettings.defaultCurrencyId
      let filtered = allProducts

      if (designConfig.filterOnlyInStock !== false) {
        filtered = filtered.filter(
          (p) => p.variants?.some((v) => (v.inventoryQuantity ?? 0) > 0)
        )
      }
      if (designConfig.filterPriceGreaterThanZero !== false) {
        filtered = filtered.filter((p) =>
          p.variants?.some((v) => {
            const price = v.prices?.find((pr) => pr.currencyId === currencyId)
            return price && price.price > 0
          })
        )
      }

      if (!filtered.length) {
        toast({
          variant: "destructive",
          title: "Sin resultados",
          description: "No hay productos que coincidan con los filtros aplicados.",
        })
        return
      }

      const selectedCurrency =
        currentShopSettings.acceptedCurrencies?.find((c) => c.id === currencyId) ??
        currentShopSettings.defaultCurrency
      const storeData = {
        name: currentShopSettings.name,
        logo: currentShopSettings.logo ?? undefined,
        settings: currentShopSettings,
      }
      const htmlContent = PDFService.generateProductCatalogHTML(
        filtered,
        designConfig,
        storeData,
        selectedCurrency,
        selectedCategories.length ? selectedCategories : undefined
      )

      if (printWindow.closed) {
        toast({
          variant: "destructive",
          title: "Advertencia",
          description: "La ventana fue cerrada. No se pudo mostrar el catálogo.",
        })
        return
      }
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        if (!printWindow.closed) {
          try {
            printWindow.focus()
            printWindow.print()
          } catch (e) {
            console.error("Error al imprimir:", e)
          }
        }
      }, 500)
      toast({
        title: "PDF Generado",
        description: `Catálogo con ${filtered.length} productos generado correctamente.`,
      })
      closeDialog()
    } catch (error) {
      console.error("Error generando PDF:", error)
      if (!printWindow?.closed) printWindow?.close()
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el PDF.",
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
    handleGeneratePDF,
    getCurrentShopSettings: () => currentShopSettings,
  }
}
