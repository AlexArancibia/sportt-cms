"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/axiosConfig"
import { PDFExportConfig } from "@/types/pdf-export"
import { PDFService } from "@/lib/pdf/pdf-service"
import { Product } from "@/types/product"
import { useStores } from "@/hooks/useStores"
import { useShopSettings } from "@/hooks/useShopSettings"
import type { PaginatedProductsResponse, ProductSearchParams } from "@/types/product"

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
  params?.status?.forEach((s) => queryParams.append("status", s))

  const url = `/products/${storeId}?${queryParams.toString()}`
  const response = await apiClient.get<PaginatedProductsResponse>(url)

  if (!response.data?.data || !response.data?.pagination) {
    throw new Error("Invalid API response structure")
  }

  return response.data
}

export function useProductPDFExport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: currentShopSettings } = useShopSettings(currentStoreId)

  const openDialog = () => {
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
  }

  const handleGeneratePDF = async (
    designConfig: PDFExportConfig,
    searchTerm: string,
    selectedVendors: string[],
    selectedCategories: string[]
  ) => {
    setIsExporting(true)

    try {
      // Verificar que hay una tienda seleccionada
      if (!currentStoreId) {
        toast({
          title: "Error",
          description: "No se ha seleccionado una tienda",
          variant: "destructive",
        })
        setIsExporting(false)
        return
      }

      // Get shop settings for the current store
      if (!currentShopSettings) {
        toast({
          title: "Error",
          description: "No se encontró la configuración de la tienda",
          variant: "destructive",
        })
        setIsExporting(false)
        return
      }

      // Open print window immediately to avoid popup blockers
      // Must be done synchronously from user action
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        toast({
          title: "Error",
          description: "No se pudo abrir la ventana de impresión. Verifica que las ventanas emergentes estén permitidas.",
          variant: "destructive",
        })
        setIsExporting(false)
        return
      }

      // Show loading message in the print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cargando catálogo...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <p>Cargando productos para el catálogo...</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()

      // Fetch all products matching table filters with pagination
      // Backend limit is 100 per page, so we need to fetch page by page
      try {
        const allProducts: Product[] = []
        let currentPage = 1
        let hasMorePages = true
        const limitPerPage = 100 // Backend maximum limit

        while (hasMorePages) {
          const response = await fetchProductsByStore(currentStoreId, {
            page: currentPage,
            limit: limitPerPage,
            query: searchTerm || undefined,
            vendor: selectedVendors.length > 0 ? selectedVendors : undefined,
            categorySlugs: selectedCategories.length > 0 ? selectedCategories : undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })

          const pageProducts = response.data
          allProducts.push(...pageProducts)

          // Check if there are more pages
          const pagination = response.pagination
          hasMorePages = Boolean(pagination.hasNext) && pageProducts.length === limitPerPage

          currentPage++
        }

        // Apply frontend filters
        let filteredProducts = allProducts
        const selectedCurrencyId = designConfig.currencyId || currentShopSettings.defaultCurrencyId

        // Filter: Only products with stock (at least one variant with inventoryQuantity > 0)
        // Default to true if undefined
        if (designConfig.filterOnlyInStock !== false) {
          filteredProducts = filteredProducts.filter((product) => {
            if (!product.variants || product.variants.length === 0) return false
            return product.variants.some((variant) => (variant.inventoryQuantity || 0) > 0)
          })
        }

        // Filter: Only products with price > 0 in the SELECTED currency
        // Default to true if undefined
        if (designConfig.filterPriceGreaterThanZero !== false) {
          filteredProducts = filteredProducts.filter((product) => {
            if (!product.variants || product.variants.length === 0) return false
            
            // Check if at least one variant has a price > 0 in the selected currency
            return product.variants.some((variant) => {
              if (!variant.prices || variant.prices.length === 0) return false
              
              // MUST check price in selected currency only
              const priceInCurrency = variant.prices.find(
                (price) => price.currencyId === selectedCurrencyId
              )
              return priceInCurrency && priceInCurrency.price > 0
            })
          })
        }

        // Validate filtered products
        if (filteredProducts.length === 0) {
          toast({
            title: "Sin resultados",
            description: "No hay productos que coincidan con los filtros aplicados.",
            variant: "destructive",
          })
          setIsExporting(false)
          return
        }

        // Get selected currency object using already defined selectedCurrencyId
        const selectedCurrency = currentShopSettings.acceptedCurrencies?.find(
          c => c.id === selectedCurrencyId
        ) || currentShopSettings.defaultCurrency

        // Prepare store data with ShopSettings
        const storeData = {
          name: currentShopSettings.name,
          logo: currentShopSettings.logo || undefined,
          settings: currentShopSettings,
        }

        // Generate PDF HTML content
        try {
          const htmlContent = PDFService.generateProductCatalogHTML(
            filteredProducts,
            designConfig,
            storeData,
            selectedCurrency,
            selectedCategories.length > 0 ? selectedCategories : undefined
          )

          // Write the HTML content to the already open window
          if (!printWindow.closed) {
            printWindow.document.open()
            printWindow.document.write(htmlContent)
            printWindow.document.close()

            // Wait for content to load then print
            setTimeout(() => {
              if (!printWindow.closed) {
                try {
                  printWindow.focus()
                  printWindow.print()
                } catch (printError) {
                  console.error('Error al imprimir:', printError)
                }
              }
            }, 500)

            toast({
              title: "PDF Generado",
              description: `Catálogo con ${filteredProducts.length} productos generado exitosamente.`,
            })
            closeDialog()
          } else {
            toast({
              title: "Advertencia",
              description: "La ventana de impresión fue cerrada. El catálogo está listo pero no se pudo abrir la impresión automáticamente.",
              variant: "destructive",
            })
          }
        } catch (pdfError) {
          console.error('Error en generación de PDF:', pdfError)
          if (!printWindow.closed) {
            printWindow.close()
          }
          toast({
            title: "Error",
            description: pdfError instanceof Error ? pdfError.message : "Error al generar el PDF.",
            variant: "destructive",
          })
        }
      } catch (fetchError) {
        console.error('Error fetching products:', fetchError)
        toast({
          title: "Error",
          description: "Error al obtener los productos. Por favor intenta nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el PDF. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Get current shop settings for default colors
  const getCurrentShopSettings = () => {
    return currentShopSettings
  }

  return {
    isDialogOpen,
    isExporting,
    openDialog,
    closeDialog,
    handleGeneratePDF,
    getCurrentShopSettings,
  }
}
