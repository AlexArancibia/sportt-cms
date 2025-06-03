"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TableIcon, Palette, Type, Trash2 } from "lucide-react"

interface TableToolbarProps {
  editor: any
  isActive: boolean
}

export function TableToolbar({ editor, isActive }: TableToolbarProps) {
  const [bgColor, setBgColor] = useState("#ffffff")
  const [textColor, setTextColor] = useState("#000000")

  if (!isActive || !editor) {
    return null
  }

  const setCellBackground = (color: string) => {
    setBgColor(color)
    editor.chain().focus().setCellAttribute("backgroundColor", color).run()
  }

  const setCellTextColor = (color: string) => {
    setTextColor(color)
    editor.chain().focus().setCellAttribute("textColor", color).run()
  }

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run()
  }

  const addRowBefore = () => {
    editor.chain().focus().addRowBefore().run()
  }

  const addRowAfter = () => {
    editor.chain().focus().addRowAfter().run()
  }

  const addColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run()
  }

  const addColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run()
  }

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run()
  }

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run()
  }

  return (
    <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-md border mt-1 mb-2">
      <div className="flex items-center">
        <TableIcon className="h-4 w-4 mr-2" />
        <span className="text-xs font-medium">Tabla</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={addRowBefore} className="text-xs h-7">
          + Fila antes
        </Button>
        <Button variant="ghost" size="sm" onClick={addRowAfter} className="text-xs h-7">
          + Fila después
        </Button>
        <Button variant="ghost" size="sm" onClick={addColumnBefore} className="text-xs h-7">
          + Col antes
        </Button>
        <Button variant="ghost" size="sm" onClick={addColumnAfter} className="text-xs h-7">
          + Col después
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="ghost" size="sm" onClick={deleteRow} className="text-xs h-7">
          - Fila
        </Button>
        <Button variant="ghost" size="sm" onClick={deleteColumn} className="text-xs h-7">
          - Columna
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Fondo:</span>
                <ColorPicker value={bgColor} onChange={setCellBackground} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Texto:</span>
                <ColorPicker value={textColor} onChange={setCellTextColor} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={deleteTable} className="h-7 w-7 p-0 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
