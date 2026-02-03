"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { DesignTab } from "./export/DesignTab"
import { PDFExportConfig } from "@/types/pdf-export"
import { ShopSettings } from "@/types/store"
import { Currency } from "@/types/currency"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ExportPDFDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (designConfig: PDFExportConfig) => Promise<void>
  storeLogo?: string
  shopSettings?: ShopSettings
  isExporting?: boolean
  currencies?: Currency[]
  defaultCurrencyId?: string
}

export function ExportPDFDialog({
  open,
  onOpenChange,
  onExport,
  storeLogo,
  shopSettings,
  isExporting = false,
  currencies = [],
  defaultCurrencyId,
}: ExportPDFDialogProps) {
  // Default design configuration with shopSettings colors
  const getDefaultDesignConfig = (): PDFExportConfig => ({
    primaryColor: shopSettings?.primaryColor || '#2563eb',
    secondaryColor: shopSettings?.secondaryColor || '#10b981',
    includeLogo: true,
    layout: 'grid',
    includeImages: true,
    currencyId: defaultCurrencyId,
    filterOnlyInStock: true, // Default: only products with stock
    filterPriceGreaterThanZero: true, // Default: only products with price > 0
  })

  const [designConfig, setDesignConfig] = useState<PDFExportConfig>(getDefaultDesignConfig())

  // Update design config when shopSettings changes
  useEffect(() => {
    if (shopSettings && open) {
      setDesignConfig(prev => ({
        ...prev,
        primaryColor: shopSettings.primaryColor || prev.primaryColor,
        secondaryColor: shopSettings.secondaryColor || prev.secondaryColor,
        currencyId: prev.currencyId || defaultCurrencyId,
      }))
    }
  }, [shopSettings, open, defaultCurrencyId])

  const handleExport = async () => {
    await onExport(designConfig)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Exportar Productos a PDF</DialogTitle>
          <DialogDescription>
            Configura el diseño del catálogo de productos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto mt-4">
          <div className="p-1">
            <DesignTab
              designConfig={designConfig}
              onDesignChange={setDesignConfig}
              storeLogo={storeLogo}
              currencies={currencies}
              defaultCurrencyId={defaultCurrencyId}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar PDF'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
