"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface TeamsHeaderProps {
  title: string
  subtitle: string
  isSubmitting: boolean
  onSubmit: () => void
  jsonData?: any
  jsonLabel?: string
}

export function TeamsHeader({ title, subtitle, isSubmitting, onSubmit, jsonData }: TeamsHeaderProps) {
  const router = useRouter()
  const memberCount = jsonData?.members?.length || 0

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 py-2 sm:py-3 px-4 sm:px-6 border-b backdrop-blur-md bg-background/90 flex justify-between items-center transition-all duration-200 w-full max-w-full shadow-sm"
    >
      <div className="flex gap-2 sm:gap-3 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/teams")}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-muted transition-colors duration-200 flex-shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <div className="overflow-hidden">
          <h2 className="font-medium tracking-tight text-base sm:text-lg truncate max-w-[150px] sm:max-w-[300px] md:max-w-none">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px] md:max-w-none">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
            <span className={`${memberCount === 0 ? "text-destructive" : "text-primary"}`}>
              {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
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
    </motion.header>
  )
}
