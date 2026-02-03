"use client"

import { useState, useMemo } from "react"
import { Code, X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { JSX } from "react"

interface JsonViewerProps {
  jsonData?: Record<string, any> | any[] | any
  jsonLabel?: string
  triggerClassName?: string
}

export function JsonViewer({ jsonData, jsonLabel = "data", triggerClassName }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)

  // Process the jsonData to ensure it's in the format we need for the tabs
  // Use useMemo to recalculate when jsonData changes
  const processedData: Record<string, any> = useMemo(() => {
    if (!jsonData) return {}

    // If jsonData is an array, wrap it in an object with the provided label
    if (Array.isArray(jsonData)) {
      return { [jsonLabel]: jsonData }
    }

    // If jsonData is already a Record<string, any>, use it directly
    if (typeof jsonData === "object" && !Array.isArray(jsonData)) {
      return jsonData
    }

    // Fallback: wrap anything else in an object
    return { [jsonLabel]: jsonData }
  }, [jsonData, jsonLabel])

  const hasData = Object.keys(processedData).length > 0

  // Function to copy JSON to clipboard
  const copyToClipboard = async () => {
    try {
      const jsonString = JSON.stringify(processedData, null, 2)
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Function to determine if a value should be highlighted as a specific type
  const getValueClass = (value: any): string => {
    if (value === null) return "text-zinc-400 dark:text-zinc-500"
    if (typeof value === "boolean") return "text-violet-600 dark:text-violet-400"
    if (typeof value === "number") return "text-blue-600 dark:text-blue-400"
    if (typeof value === "string") return "text-emerald-600 dark:text-emerald-400"
    return ""
  }

  // Function to render JSON with syntax highlighting
  const renderJson = (obj: any): JSX.Element => {
    if (obj === null) return <span className="text-zinc-400 dark:text-zinc-500">null</span>

    if (typeof obj !== "object") {
      return <span className={getValueClass(obj)}>{typeof obj === "string" ? `"${obj}"` : String(obj)}</span>
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

  if (!hasData) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="View JSON Data"
          className={cn(
            "relative overflow-hidden group hover:border-primary/30 hover:bg-primary/5 transition-all duration-200",
            triggerClassName,
          )}
        >
          <Code className="h-4 w-4 relative z-10 text-primary/70 group-hover:text-primary transition-colors" />
          <span className="absolute inset-0 bg-primary/5 transform scale-0 group-hover:scale-100 transition-transform duration-200 rounded-sm" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] md:max-w-4xl h-[92vh] md:h-[85vh] p-0 gap-0 border border-zinc-200/80 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950 rounded-xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-zinc-50/80 dark:bg-zinc-900/50 sticky top-0 z-10 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-primary/90">
            <Code className="h-5 w-5 text-primary/70" />
            <span>JSON Data Viewer</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>
        <Tabs defaultValue={Object.keys(processedData)[0]} className="w-full h-[calc(100%-60px)]">
          <div className="border-b sticky top-[60px] z-10 bg-white dark:bg-zinc-950">
            <ScrollArea className="w-full">
              <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-zinc-50 dark:bg-zinc-900/30 p-0 inline-flex">
                {Object.keys(processedData).map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="rounded-none border-r h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:border-b-2 data-[state=active]:border-b-primary px-6 py-0 transition-all font-medium"
                  >
                    {key}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          {Object.entries(processedData).map(([key, data]) => (
            <TabsContent
              key={key}
              value={key}
              className="h-[calc(100%-48px)] m-0 p-0 data-[state=active]:animate-in data-[state=active]:fade-in-50"
            >
              <ScrollArea className="h-full max-h-[calc(92vh-108px)]">
                <div className={cn("p-8 font-mono text-sm leading-relaxed", "bg-white dark:bg-zinc-950")}>
                  {renderJson(data)}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
