"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { JsonViewer } from "./json-viewer"
import { ThemeToggle } from "./ThemeToggle"

interface HeaderProps {
  title: string
  jsonData?: Record<string, any> | any[] | any
  jsonLabel?: string
}

export function HeaderBar({ title, jsonData, jsonLabel = "data" }: HeaderProps) {
  return (
    <header className="py-2 px-3 border-b border-border flex justify-between items-center">
      <div className="flex gap-2 items-center text-foreground">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="flex items-center gap-2">
        <JsonViewer jsonData={jsonData} jsonLabel={jsonLabel} />
        <ThemeToggle />
      </div>
    </header>
  )
}
