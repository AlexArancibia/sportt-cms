"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const predefinedColors = [
  "#ffffff", // Blanco
  "#f8fafc", // Slate 50
  "#f1f5f9", // Slate 100
  "#e2e8f0", // Slate 200
  "#cbd5e1", // Slate 300
  "#94a3b8", // Slate 400
  "#64748b", // Slate 500
  "#475569", // Slate 600
  "#334155", // Slate 700
  "#1e293b", // Slate 800
  "#0f172a", // Slate 900
  "#020617", // Slate 950
  "#f0f9ff", // Sky 50
  "#e0f2fe", // Sky 100
  "#bae6fd", // Sky 200
  "#7dd3fc", // Sky 300
  "#38bdf8", // Sky 400
  "#0ea5e9", // Sky 500
  "#0284c7", // Sky 600
  "#0369a1", // Sky 700
  "#075985", // Sky 800
  "#0c4a6e", // Sky 900
  "#082f49", // Sky 950
  "#f0fdfa", // Teal 50
  "#ccfbf1", // Teal 100
  "#99f6e4", // Teal 200
  "#5eead4", // Teal 300
  "#2dd4bf", // Teal 400
  "#14b8a6", // Teal 500
  "#0d9488", // Teal 600
  "#0f766e", // Teal 700
  "#115e59", // Teal 800
  "#134e4a", // Teal 900
  "#042f2e", // Teal 950
  "#fdf4ff", // Fuchsia 50
  "#fae8ff", // Fuchsia 100
  "#f5d0fe", // Fuchsia 200
  "#f0abfc", // Fuchsia 300
  "#e879f9", // Fuchsia 400
  "#d946ef", // Fuchsia 500
  "#c026d3", // Fuchsia 600
  "#a21caf", // Fuchsia 700
  "#86198f", // Fuchsia 800
  "#701a75", // Fuchsia 900
  "#4a044e", // Fuchsia 950
  "#fff1f2", // Rose 50
  "#ffe4e6", // Rose 100
  "#fecdd3", // Rose 200
  "#fda4af", // Rose 300
  "#fb7185", // Rose 400
  "#f43f5e", // Rose 500
  "#e11d48", // Rose 600
  "#be123c", // Rose 700
  "#9f1239", // Rose 800
  "#881337", // Rose 900
  "#4c0519", // Rose 950
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = useState(value || "#ffffff")

  useEffect(() => {
    setColor(value || "#ffffff")
  }, [value])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    onChange(newColor)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-between", className)}
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border" style={{ backgroundColor: color }} />
            <span
              className={cn("text-xs", color === "#ffffff" || color.startsWith("#f") ? "text-black" : "text-white")}
            >
              {color}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded border" style={{ backgroundColor: color }} />
            <input
              type="text"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-10 cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-8 gap-1 mt-3">
          {predefinedColors.map((c) => (
            <button
              key={c}
              className={cn(
                "h-6 w-6 rounded-md border flex items-center justify-center",
                color === c && "ring-2 ring-ring ring-offset-1",
              )}
              style={{ backgroundColor: c }}
              onClick={() => handleColorChange(c)}
            >
              {color === c && (
                <Check className={cn("h-4 w-4", c === "#ffffff" || c.startsWith("#f") ? "text-black" : "text-white")} />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
