"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

// Cambiar la interfaz para usar onColorChange en lugar de onChange
interface ColorPickerProps {
  label: string
  color: string
  onColorChange: (color: string) => void
}

export function ColorPicker({ label, color, onColorChange }: ColorPickerProps) {
  const [hexColor, alpha] = React.useMemo(() => {
    const rgba = color.match(/^rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?$$$/)
    if (rgba) {
      const r = Number.parseInt(rgba[1], 10)
      const g = Number.parseInt(rgba[2], 10)
      const b = Number.parseInt(rgba[3], 10)
      const a = rgba[4] ? Number.parseFloat(rgba[4]) : 1
      return [`#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`, a]
    }
    return [color, 1]
  }, [color])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    onColorChange(convertHexToRGBA(newColor, alpha))
  }

  const handleAlphaChange = (value: number[]) => {
    onColorChange(convertHexToRGBA(hexColor, value[0]))
  }

  const convertHexToRGBA = (hex: string, alpha: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <Input type="color" value={hexColor} onChange={handleColorChange} className="h-10 w-14 p-0 border-0" />
        <Slider value={[alpha]} min={0} max={1} step={0.01} onValueChange={handleAlphaChange} className="flex-grow" />
      </div>
    </div>
  )
}

