"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { JsonViewer } from "@/components/json-viewer"

interface CollectionHeaderProps {
  title: string
  subtitle: string
  isSubmitting: boolean
  onSubmit: () => void
  jsonData?: any
  jsonLabel?: string
  itemCount?: number
  itemLabel?: string
}

export function CollectionHeader({
  title,
  subtitle,
  isSubmitting,
  onSubmit,
  jsonData,
  jsonLabel,
  itemCount = 0,
  itemLabel = "productos",
}: CollectionHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-10 py-2 sm:py-3 px-3 sm:px-4 border-b backdrop-blur-md bg-background/90 flex justify-between items-center transition-all duration-200">
      <div className="flex gap-2 sm:gap-3 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-muted transition-colors duration-200"
          aria-label="Volver"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <div>
          <h2 className="font-medium tracking-tight text-base sm:text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {jsonData && (
          <div className="hidden sm:block">
            <JsonViewer jsonData={jsonData} jsonLabel={jsonLabel || "Datos a enviar"} />
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
            <span className={`${itemCount === 0 ? "text-destructive" : "text-primary"}`}>
              {itemCount} {itemCount === 1 ? itemLabel.replace(/s$/, "") : itemLabel}
            </span>
          </div>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            size="sm"
            className="gap-1 sm:gap-1.5 bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                <span className="hidden sm:inline">Guardando...</span>
                <span className="sm:hidden">Guardando</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Guardar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
