"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { 
  CSVExportConfig, 
  ExportEntityType,
  PRODUCT_FORMAT_OPTIONS,
  ORDER_FORMAT_OPTIONS 
} from "@/types/csv-export"

interface ExportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (config: CSVExportConfig) => Promise<void>
  isExporting: boolean
  type: ExportEntityType
}

export function ExportCSVDialog({
  open,
  onOpenChange,
  onExport,
  isExporting,
  type,
}: ExportCSVDialogProps) {
  // Determinar opciones de formato según el tipo
  const formatOptions = type === 'products' ? PRODUCT_FORMAT_OPTIONS : ORDER_FORMAT_OPTIONS
  
  // Estado del formulario
  const [format, setFormat] = useState<'summary' | 'detailed'>('summary')
  const [filename, setFilename] = useState('')

  // Resetear formulario cuando se abre el dialog
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormat('summary')
      setFilename('')
    }
    onOpenChange(open)
  }

  // Manejar exportación
  const handleExport = async () => {
    const config: CSVExportConfig = {
      format,
      filename: filename.trim() || undefined,
    }
    await onExport(config)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Exportar {type === 'products' ? 'Productos' : 'Órdenes'} a CSV
          </DialogTitle>
          <DialogDescription>
            Configura las opciones de exportación para generar el archivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formato de exportación */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Formato de exportación</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'summary' | 'detailed')}>
              {formatOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Nombre del archivo */}
          <div className="space-y-2">
            <Label htmlFor="filename">
              Nombre del archivo <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="filename"
              placeholder={
                type === 'products' 
                  ? format === 'detailed' ? 'productos-variantes' : 'productos'
                  : format === 'detailed' ? 'ordenes-detalle' : 'ordenes'
              }
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isExporting}
            />
            <p className="text-xs text-muted-foreground">
              Se agregará automáticamente la fecha y hora al nombre del archivo
            </p>
          </div>
        </div>

        <DialogFooter>
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
                Exportando...
              </>
            ) : (
              'Exportar CSV'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

