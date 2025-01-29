"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductOption {
  title: string
  values: string[]
}

interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
}

interface VariantOptionsProps {
  useVariants: boolean
  onUseVariantsChange: (value: boolean) => void
  options: ProductOption[]
  onOptionsChange: (options: ProductOption[]) => void
  variants: VariantCombination[]
  onVariantsChange: (variants: VariantCombination[]) => void
}

export function VariantOptions({
  useVariants,
  onUseVariantsChange,
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
}: VariantOptionsProps) {
  const [newOptionValue, setNewOptionValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAddOption = () => {
    if (options.length >= 3) {
      setError("You can only add up to 3 options.")
      return
    }
    setError(null)
    onOptionsChange([...options, { title: "", values: [] }])
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
  }

  const handleOptionTitleChange = (index: number, title: string) => {
    if (options.some((option, i) => i !== index && option.title.toLowerCase() === title.toLowerCase())) {
      setError("Option titles must be unique.")
      return
    }
    setError(null)
    const newOptions = options.map((option, i) => (i === index ? { ...option, title } : option))
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
  }

  const handleAddValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return
    const newOptions = options.map((option, i) =>
      i === optionIndex ? { ...option, values: [...option.values, value.trim()] } : option,
    )
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
    setNewOptionValue("")
  }

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = options.map((option, i) =>
      i === optionIndex ? { ...option, values: option.values.filter((_, vI) => vI !== valueIndex) } : option,
    )
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
  }

  const generateVariantCombinations = (currentOptions: ProductOption[]) => {
    if (!currentOptions.length) {
      onVariantsChange([])
      return
    }

    const generateCombos = (optionIndex = 0, current: Record<string, string> = {}): Record<string, string>[] => {
      if (optionIndex >= currentOptions.length) return [current]

      const currentOption = currentOptions[optionIndex]
      return currentOption.values.flatMap((value) => {
        const newCurrent = { ...current, [currentOption.title]: value }
        return generateCombos(optionIndex + 1, newCurrent)
      })
    }

    const combinations = generateCombos()
    const existingVariants = new Map(variants.map((v) => [JSON.stringify(v.attributes), v]))

    const newVariants = combinations.map((combo) => {
      const key = JSON.stringify(combo)
      const existing = existingVariants.get(key)
      const timestamp = Date.now()
      const id =
        existing?.id ||
        `variant-${timestamp}-${Object.values(combo).join("-")}-${Math.random().toString(36).substr(2, 9)}`
      return {
        id,
        enabled: existing?.enabled ?? true,
        attributes: combo,
      }
    })

    // Asegurarse de que no haya IDs duplicados
    const uniqueVariants = newVariants.reduce((acc, variant) => {
      if (!acc.some((v) => v.id === variant.id)) {
        acc.push(variant)
      }
      return acc
    }, [] as VariantCombination[])

    onVariantsChange(uniqueVariants)
  }

  const toggleVariant = (variantId: string) => {
    onVariantsChange(variants.map((v) => (v.id === variantId ? { ...v, enabled: !v.enabled } : v)))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
      <h3 className="text-lg font-semibold">Variaciones</h3>
        <div className="flex items-center space-x-2">
          <Switch checked={useVariants} onCheckedChange={onUseVariantsChange} />
          <Label>Si, es un producto con variantes</Label>
        </div>
      </div>

      {useVariants && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Atributos</h4>
                <p className="text-sm text-muted-foreground">
                  Define los atributos del producto, e.g. color, talla, material etc.
                </p>
              </div>
              <Button onClick={handleAddOption} variant="secondary" size="sm">
                Añadir
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {options.map((option, optionIndex) => (
              <div key={optionIndex} className="rounded-lg border bg-muted/20 p-4 py-2 flex justify-between">
                <div className="flex gap-2 flex-col">
                  <div className="flex items-center">
                    <div className="flex w-fit items-center">
                      <span className="content-font w-[80px]">Atributo </span>
                      <Input
                        value={option.title}
                        onChange={(e) => handleOptionTitleChange(optionIndex, e.target.value)}
                        placeholder="Nombre del atributo"
                        className="w-[300px] h-8 lg:w-[450px] placeholder:text-primary/40 bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex w-fit items-center">
                      <span className="content-font w-[80px]">Valor </span>

                      <div className="flex gap-2">
                        <Input
                          value={newOptionValue}
                          onChange={(e) => setNewOptionValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault()
                              handleAddValue(optionIndex, newOptionValue)
                            }
                          }}
                          placeholder="Escriba los valores separados por  ',' o dando Enter"
                          className="w-[300px] h-8 lg:w-[450px] placeholder:text-primary/40 bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {option.values.map((value, valueIndex) => (
                      <span
                        key={valueIndex}
                        className="flex items-center gap-1 text-[13px] text-sky-700/90 rounded-md bg-background border border-border/50 px-2.5 py-0.5 text-sm"
                      >
                        {value}
                        <Button
                          onClick={() => handleRemoveValue(optionIndex, valueIndex)}
                          className="text-muted-foreground hover:text-foreground h-4 w-4 px-2"
                          variant="ghost"
                        >
                          <X className="h-3 w-3 text-sky-700/90" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="">
                  <Button
                    onClick={() => handleRemoveOption(optionIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/90 p-0 pt-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {variants.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Tabla de Variaciones</h4>
                <p className="text-sm text-muted-foreground">
                  Selecciona la variantes que deseas mostrar en tu tienda.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      {options.map((option, index) => (
                        <TableHead key={index} className="text-center">
                          {option.title}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody>
                    {variants.map((variant) => (
                      <TableRow key={variant.id} className="hover:bg-muted/50 transition-colors">
                        {/* Reorder and Checkbox */}
                        <TableCell className="flex items-center gap-2 pl-8">
                          <Checkbox
                            checked={variant.enabled}
                            onCheckedChange={() => toggleVariant(variant.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>

                        {/* Attribute Values */}
                        {options.map((option, index) => (
                          <TableCell key={index} className="text-center text-muted-foreground">
                            {variant.attributes[option.title] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {options.length === 0 && (
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-center text-sm text-muted-foreground">Añade atributos para crear variantes.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

