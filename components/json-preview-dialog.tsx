"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Code } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JsonPreviewDialogProps {
  title: string
  data: any
  trigger?: React.ReactNode
  className?: string
}

export function JsonPreviewDialog({ title, data, trigger, className }: JsonPreviewDialogProps) {
  const [open, setOpen] = useState(false)

  const formattedJson = JSON.stringify(data, null, 2)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson)
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              Copiar JSON
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 mt-4 border rounded-md bg-muted/50">
          <pre className="p-4 text-sm overflow-x-auto">{formattedJson}</pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
