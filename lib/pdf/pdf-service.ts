import { Product } from '@/types/product'
import { PDFExportConfig, PDFTemplateData, PDFGenerationResult } from '@/types/pdf-export'
import { ShopSettings } from '@/types/store'
import { Currency } from '@/types/currency'
import { generateProductCatalogHTML } from './templates/product-catalog-template'

/**
 * Store data interface for PDF generation
 */
export interface PDFStoreData {
  name: string
  logo?: string
  settings?: ShopSettings
}

/**
 * PDFService - Reusable service for generating PDFs
 * Uses HTML + window.print() approach for PDF generation
 */
export class PDFService {
  /**
   * Generate HTML content for product catalog (without opening print window)
   * Use this when you need to open the window yourself (e.g., before async operations)
   */
  static generateProductCatalogHTML(
    products: Product[],
    config: PDFExportConfig,
    storeData: PDFStoreData,
    currency?: Currency,
    selectedCategorySlugs?: string[]
  ): string {
    // Validate inputs
    if (!products || products.length === 0) {
      throw new Error('No hay productos para exportar')
    }

    // Prepare template data
    const templateData: PDFTemplateData = {
      storeName: storeData.settings?.name || storeData.name,
      storeLogo: config.includeLogo ? storeData.settings?.logo || storeData.logo : undefined,
      generatedDate: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      products,
      totalProducts: products.length,
      config,
      currency: currency || storeData.settings?.defaultCurrency,
      contactInfo: {
        email: storeData.settings?.email || undefined,
        phone: storeData.settings?.phone || undefined,
        website: storeData.settings?.domain || undefined,
      },
      selectedCategorySlugs,
    }

    // Generate and return HTML
    return generateProductCatalogHTML(templateData)
  }

  /**
   * Generate a product catalog PDF (opens print window immediately)
   * @deprecated Use generateProductCatalogHTML and open window manually if you need async operations first
   */
  static generateProductCatalog(
    products: Product[],
    config: PDFExportConfig,
    storeData: PDFStoreData,
    currency?: Currency
  ): PDFGenerationResult {
    try {
      // Validate inputs
      if (!products || products.length === 0) {
        return {
          success: false,
          message: 'No hay productos para exportar',
        }
      }

      // Generate HTML
      const htmlContent = this.generateProductCatalogHTML(products, config, storeData, currency, undefined)

      // Open print window - must be called synchronously from user action
      this.openPrintWindow(htmlContent)

      return {
        success: true,
        message: 'PDF generado exitosamente',
        productsCount: products.length,
      }
    } catch (error) {
      console.error('Error generating product catalog PDF:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al generar el PDF. Por favor intente nuevamente.',
      }
    }
  }

  /**
   * Open print window with HTML content
   * Private static method used internally
   * Note: This should be called synchronously from a user action to avoid popup blockers
   */
  private static openPrintWindow(htmlContent: string): void {
    try {
      // Try to open window - if blocked, the error will be caught
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        throw new Error('No se pudo abrir la ventana de impresión. Verifica que las ventanas emergentes estén permitidas.')
      }

      // Write HTML content
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for window to be fully loaded before printing
      const checkAndPrint = () => {
        try {
          // Check if window is still open and document is ready
          if (printWindow.closed) {
            console.warn('Ventana de impresión cerrada por el usuario')
            return
          }

          if (printWindow.document.readyState === 'complete') {
            // Additional delay to ensure all images are loaded
            setTimeout(() => {
              try {
                if (!printWindow.closed) {
                  printWindow.focus()
                  printWindow.print()
                }
              } catch (printError) {
                console.error('Error al imprimir:', printError)
                // Even if print fails, at least the window is open and user can manually print
              }
            }, 500)
          } else {
            // Retry after a short delay
            setTimeout(checkAndPrint, 100)
          }
        } catch (error) {
          console.error('Error verificando estado del documento:', error)
          // Try to print anyway after delay
          setTimeout(() => {
            try {
              if (printWindow && !printWindow.closed) {
                printWindow.focus()
                printWindow.print()
              }
            } catch (printError) {
              console.error('Error al imprimir:', printError)
            }
          }, 1000)
        }
      }

      // Start checking after a brief initial delay
      setTimeout(checkAndPrint, 100)
    } catch (error) {
      console.error('Error al abrir ventana de impresión:', error)
      throw error
    }
  }

  /**
   * Future: Generate order report PDF
   * To be implemented when needed
   */
  static generateOrderReport(/* orders, config */): PDFGenerationResult {
    return {
      success: false,
      message: 'Funcionalidad no implementada aún',
    }
  }

  /**
   * Future: Generate inventory report PDF
   * To be implemented when needed
   */
  static generateInventoryReport(/* inventory, config */): PDFGenerationResult {
    return {
      success: false,
      message: 'Funcionalidad no implementada aún',
    }
  }
}


