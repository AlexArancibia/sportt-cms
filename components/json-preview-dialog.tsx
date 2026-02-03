"use client"

import { useState, useMemo, useCallback } from "react"
import type React from "react"
import type { JSX } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Code, Copy, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JsonPreviewDialogProps {
  title: string
  data: any
  trigger?: React.ReactNode
  className?: string
}

// Constantes para colores de sintaxis
const VALUE_CLASSES = {
  null: "text-zinc-400 dark:text-zinc-500",
  boolean: "text-violet-600 dark:text-violet-400",
  number: "text-blue-600 dark:text-blue-400",
  string: "text-emerald-600 dark:text-emerald-400",
} as const

// Estilos CSS para scrollbar (mover fuera del componente para evitar recreación)
const SCROLLBAR_STYLES = `
  .json-scroll-container [data-radix-scroll-area-scrollbar] {
    background-color: rgb(228 228 231) !important;
  }
  .dark .json-scroll-container [data-radix-scroll-area-scrollbar] {
    background-color: rgb(63 63 70) !important;
  }
  .json-scroll-container [data-radix-scroll-area-scrollbar]:hover {
    background-color: rgb(212 212 216) !important;
  }
  .dark .json-scroll-container [data-radix-scroll-area-scrollbar]:hover {
    background-color: rgb(82 82 91) !important;
  }
  .json-scroll-container [data-radix-scroll-area-scrollbar] [data-radix-scroll-area-thumb] {
    background-color: rgb(161 161 170) !important;
  }
  .dark .json-scroll-container [data-radix-scroll-area-scrollbar] [data-radix-scroll-area-thumb] {
    background-color: rgb(113 113 122) !important;
  }
  .json-scroll-container [data-radix-scroll-area-scrollbar] [data-radix-scroll-area-thumb]:hover {
    background-color: rgb(113 113 122) !important;
  }
  .dark .json-scroll-container [data-radix-scroll-area-scrollbar] [data-radix-scroll-area-thumb]:hover {
    background-color: rgb(161 161 170) !important;
  }
`

export function JsonPreviewDialog({ title, data, trigger, className }: JsonPreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Memoizar el JSON formateado
  const formattedJson = useMemo(() => JSON.stringify(data, null, 2), [data])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }, [formattedJson])

  // Función optimizada para renderizar JSON con syntax highlighting
  function renderJson(obj: any): JSX.Element {
    if (obj === null) {
      return <span className={VALUE_CLASSES.null}>null</span>
    }

    if (typeof obj !== "object") {
      const type = typeof obj as "boolean" | "number" | "string"
      const className = VALUE_CLASSES[type] || ""
      return (
        <span className={className}>
          {typeof obj === "string" ? `"${obj}"` : String(obj)}
        </span>
      )
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span>[]</span>

      return (
        <div className="border-l border-zinc-200 dark:border-zinc-700 my-1">
          <div className="text-zinc-500 dark:text-zinc-400 pl-4">[</div>
          {obj.map((item, index) => (
            <div key={index} className="pl-8">
              {renderJson(item)}
              {index < obj.length - 1 && <span className="text-zinc-400 dark:text-zinc-500">,</span>}
            </div>
          ))}
          <div className="text-zinc-500 dark:text-zinc-400 pl-4">]</div>
        </div>
      )
    }

    const keys = Object.keys(obj)
    if (keys.length === 0) return <span>{"{}"}</span>

    return (
      <div className="border-l border-zinc-200 dark:border-zinc-700 my-1">
        <div className="text-zinc-500 dark:text-zinc-400 pl-4">{"{"}</div>
        {keys.map((key, index) => (
          <div key={key} className="pl-8">
            <span className="text-rose-600 dark:text-rose-400">"{key}"</span>
            <span className="text-zinc-500 dark:text-zinc-400">: </span>
            {renderJson(obj[key])}
            {index < keys.length - 1 && <span className="text-zinc-400 dark:text-zinc-500">,</span>}
          </div>
        ))}
        <div className="text-zinc-500 dark:text-zinc-400 pl-4">{"}"}</div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Code className="h-4 w-4" />
            <span>Ver JSON</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar JSON</span>
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 border-t bg-muted/30 overflow-hidden min-h-[300px] json-scroll-container">
          <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_STYLES }} />
          <ScrollArea className="h-full" style={{ height: 'calc(90vh - 120px)' }}>
            <div className="p-6 font-mono text-sm leading-relaxed">
              {renderJson(data)}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
