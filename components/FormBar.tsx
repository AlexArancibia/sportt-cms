"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { JsonViewer } from "@/components/json-viewer"
import { ThemeToggle } from "@/components/ThemeToggle"

export interface FormBarProps {
  title: string
  backUrl?: string
  onBack?: () => void
  jsonData?: any
  jsonLabel?: string
  className?: string
  showThemeToggle?: boolean
}

export function FormBar({
  title,
  backUrl,
  onBack,
  jsonData,
  jsonLabel = "data",
  className,
  showThemeToggle = true,
}: FormBarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <header className={cn("py-3 px-3 border-b border-border flex justify-between items-center", className)}>
      <div className="flex gap-2 items-center text-primary/80">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-base font-medium">{title}</h4>
      </div>
      <div className="flex items-center gap-2">
        {jsonData && <JsonViewer jsonData={jsonData} jsonLabel={jsonLabel} />}
        {showThemeToggle && <ThemeToggle />}
      </div>
    </header>
  )
}
