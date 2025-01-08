'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical, Plus, X } from 'lucide-react'
import { cn } from "@/lib/utils"

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
  isEditing: boolean
}

export function VariantOptions({
  useVariants,
  onUseVariantsChange,
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
  isEditing
}: VariantOptionsProps) {
  const [newOptionValue, setNewOptionValue] = useState('')

  const handleAddOption = () => {
    onOptionsChange([...options, { title: '', values: [] }])
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
  }

  const handleOptionTitleChange = (index: number, title: string) => {
    const newOptions = options.map((option, i) => 
      i === index ? { ...option, title } : option
    )
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
  }

  const handleAddValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return
    const newOptions = options.map((option, i) => 
      i === optionIndex 
        ? { ...option, values: [...option.values, value.trim()] }
        : option
    )
    onOptionsChange(newOptions)
    generateVariantCombinations(newOptions)
    setNewOptionValue('')
  }

  const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = options.map((option, i) => 
      i === optionIndex 
        ? { ...option, values: option.values.filter((_, vI) => vI !== valueIndex) }
        : option
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
      return currentOption.values.flatMap(value => {
        const newCurrent = { ...current, [currentOption.title]: value }
        return generateCombos(optionIndex + 1, newCurrent)
      })
    }

    const combinations = generateCombos()
    const existingVariants = new Map(variants.map(v => [
      JSON.stringify(v.attributes),
      v
    ]))

    const newVariants = combinations.map(combo => {
      const key = JSON.stringify(combo)
      const existing = existingVariants.get(key)
      const timestamp = Date.now()
      const id = existing?.id || `variant-${timestamp}-${Object.values(combo).join('-')}-${Math.random().toString(36).substr(2, 9)}`
      return {
        id,
        enabled: existing?.enabled ?? true,
        attributes: combo
      }
    })

    const uniqueVariants = newVariants.reduce((acc, variant) => {
      if (!acc.some(v => v.id === variant.id)) {
        acc.push(variant)
      }
      return acc
    }, [] as VariantCombination[])

    onVariantsChange(uniqueVariants)
  }

  const extractProductOptions = (variants: VariantCombination[]): ProductOption[] => {
    if (!variants || variants.length === 0) return [];

    const optionsMap: { [key: string]: Set<string> } = {};

    variants.forEach(variant => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!optionsMap[key]) {
          optionsMap[key] = new Set();
        }
        optionsMap[key].add(value);
      });
    });

    return Object.entries(optionsMap).map(([title, values]) => ({
      title,
      values: Array.from(values)
    }));
  };

  useEffect(() => {
    if (isEditing && variants && variants.length > 0) {
      const extractedOptions = extractProductOptions(variants);
      onOptionsChange(extractedOptions);
    }
  }, [isEditing, variants, onOptionsChange]);

  const toggleVariant = (variantId: string) => {
    onVariantsChange(
      variants.map(v => 
        v.id === variantId ? { ...v, enabled: !v.enabled } : v
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="flex items-center space-x-2">
          <Switch
            checked={useVariants}
            onCheckedChange={onUseVariantsChange}
          />
          <Label>Yes, this is a product with variants</Label>
        </div>
        {!useVariants && (
          <p className="text-sm text-muted-foreground">
            When unchecked, we will create a default variant for you
          </p>
        )}
      </div>

      {useVariants && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Product options</h4>
                <p className="text-sm text-muted-foreground">
                  Define the options for the product, e.g. color, size, etc.
                </p>
              </div>
              <Button
                onClick={handleAddOption}
                variant="secondary"
                size="sm"
              >
                Add Option
              </Button>
            </div>

            {options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className="space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <Input
                    value={option.title}
                    onChange={(e) => handleOptionTitleChange(optionIndex, e.target.value)}
                    placeholder="Option name (e.g. Color, Size)"
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => handleRemoveOption(optionIndex)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Values</Label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, valueIndex) => (
                      <span
                        key={valueIndex}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm"
                      >
                        {value}
                        <button
                          onClick={() => handleRemoveValue(optionIndex, valueIndex)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddValue(optionIndex, newOptionValue)
                        }
                      }}
                      placeholder="Enter a value and press Enter"
                    />
                    <Button
                      onClick={() => handleAddValue(optionIndex, newOptionValue)}
                      variant="secondary"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {variants.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Product variants</h4>
                <p className="text-sm text-muted-foreground">
                  This ranking will affect the variants' order in your storefront.
                </p>
              </div>

              <div className="rounded-lg border">
                <div className="grid grid-cols-[auto_1fr_1fr] gap-4 p-4 bg-muted/50">
                  <div></div>
                  {options.map((option, index) => (
                    <div key={index} className="font-medium">
                      {option.title}
                    </div>
                  ))}
                </div>

                <div className="divide-y">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="grid grid-cols-[auto_1fr_1fr] gap-4 p-4 items-center"
                    >
                      <div className="flex items-center gap-2">
                        <button className="cursor-grab hover:text-foreground text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <Checkbox
                          checked={variant.enabled}
                          onCheckedChange={() => toggleVariant(variant.id)}
                        />
                      </div>
                      {options.map((option, index) => (
                        <div key={index}>
                          {variant.attributes[option.title]}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {options.length === 0 && (
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-center text-sm text-muted-foreground">
                Add options to create variants
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

