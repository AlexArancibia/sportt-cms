import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ChevronDown, ChevronRight, X, Circle, ImageIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import { getImageUrl } from '@/lib/imageUtils'

interface Option {
  name: string;
  values: string[];
}

interface VariantCombination {
  id: string;
  productId: string;
  price: string;
  quantity: number;
  attributes: Record<string, string>;
  imageUrl: string | null;
}

interface VariantGroup {
  id: string;
  name: string;
  variants: VariantCombination[];
}

interface VariantsSectionProps {
  options: Option[];
  variantCombinations: VariantCombination[];
  onAddOption: () => void;
  onUpdateOptionName: (index: number, name: string) => void;
  onAddValueToOption: (optionIndex: number, value: string) => void;
  onRemoveValueFromOption: (optionIndex: number, valueIndex: number) => void;
  onRemoveOption: (index: number) => void;
  onUpdateVariantField: (variantId: string, field: keyof VariantCombination, value: string | number | null) => void;
  setVariantCombinations: (variants: VariantCombination[]) => void;
  onUpdateOptions: (updatedOptions: Option[]) => void;
  uploadFile: (file: File, description: string) => Promise<string>;
}

export function VariantsSection({
  options,
  variantCombinations,
  onAddOption,
  onUpdateOptionName,
  onAddValueToOption,
  onRemoveValueFromOption,
  onRemoveOption,
  onUpdateVariantField,
  setVariantCombinations,
  onUpdateOptions,
  uploadFile,
}: VariantsSectionProps) {
  const [newValue, setNewValue] = useState<string>('')
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (options.length > 0) {
      const shouldGenerateVariants = options.some(option => option.values.length > 0);
      if (shouldGenerateVariants) {
        generateVariantCombinations();
      }
    }
    if (options.length > 0 && variantCombinations.length > 0) {
      updateVariantGroups();
    }
  }, [options, variantCombinations]);

  const updateVariantGroups = () => {
    if (options.length === 0) return;
    
    const [primaryOption, ...secondaryOptions] = options;
    const groups: VariantGroup[] = [];
    
    primaryOption.values.forEach(primaryValue => {
      const groupVariants = variantCombinations.filter(
        variant => variant.attributes[primaryOption.name] === primaryValue
      );
      
      if (groupVariants.length > 0) {
        groups.push({
          id: `group-${primaryValue}`,
          name: primaryValue,
          variants: groupVariants,
        });
      }
    });

    setVariantGroups(groups);
  };

  const handleValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, optionIndex: number) => {
    if (e.key === 'Enter' && newValue.trim()) {
      onAddValueToOption(optionIndex, newValue.trim())
      setNewValue('')
    }
  }

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  const getTotalInventory = () => {
    return variantCombinations.reduce((sum, variant) => sum + variant.quantity, 0);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await uploadFile(file, `Variant image for ${variantId}`);
        onUpdateVariantField(variantId, 'imageUrl', imageUrl);
      } catch (error) {
        console.error('Error uploading variant image:', error);
        // Aquí podrías agregar una notificación de error si lo deseas
      }
    }
  };

  const generateVariantCombinations = () => {
    const generateCombos = (optionIndex = 0, current: Record<string, string> = {}): Record<string, string>[] => {
      if (optionIndex >= options.length) return [current];

      const currentOption = options[optionIndex];
      return currentOption.values.flatMap(value => {
        const newCurrent = { ...current, [currentOption.name]: value };
        return generateCombos(optionIndex + 1, newCurrent);
      });
    };

    const combinations = generateCombos();
    const newVariants = combinations.map((combo, index) => {
      const existingVariant = variantCombinations.find(v => 
        Object.entries(v.attributes).every(([key, value]) => combo[key] === value)
      );
      
      return existingVariant || {
        id: `variant-${index}`,
        productId: '',
        price: variantCombinations.length > 0 ? variantCombinations[0].price : '0',
        quantity: variantCombinations.length > 0 ? variantCombinations[0].quantity : 0,
        attributes: combo,
        imageUrl: null
      };
    });

    if (JSON.stringify(newVariants) !== JSON.stringify(variantCombinations)) {
      setVariantCombinations(newVariants);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Variantes</h2>
      </div>

      {options.length === 0 ? (
        <button
          onClick={onAddOption}
          className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir opciones como talla o color
        </button>
      ) : (
        <div className="space-y-4">
          {options.map((option, optionIndex) => (
            <div key={optionIndex} className="border rounded-md p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Nombre de la opción"
                    value={option.name}
                    onChange={(e) => onUpdateOptionName(optionIndex, e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveOption(optionIndex)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Eliminar
                </Button>
              </div>

              <div>
                <Label className="mb-2 block">Valores</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {option.values.map((value, valueIndex) => (
                    <span
                      key={valueIndex}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-sm"
                    >
                      <Circle className="h-2 w-2" />
                      {value}
                      <button
                        onClick={() => onRemoveValueFromOption(optionIndex, valueIndex)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 text-muted-foreground" />
                  <Input
                    placeholder={`Añadir ${option.name.toLowerCase()}`}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => handleValueKeyDown(e, optionIndex)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={onAddOption}
            className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir otra opción
          </button>
        </div>
      )}

      {variantGroups.length > 0 && (
        <div className="mt-6 border rounded-md">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 bg-muted/50 items-center">
            <div className="font-medium">Imagen</div>
            <div className="font-medium">Variante</div>
            <div className="font-medium">Precio</div>
            <div className="font-medium">Cantidad</div>
            <div className="font-medium"></div>
          </div>

          <div>
            {variantGroups.map(group => (
              <div key={group.id} className="border-t">
                <button
                  onClick={() => toggleGroupExpansion(group.id)}
                  className="w-full text-left px-4 py-2 flex items-center justify-between hover:bg-muted/50"
                >
                  <span className="font-medium">{group.name} ({group.variants.length} variantes)</span>
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedGroups.has(group.id) && (
                  <div>
                    {group.variants.map(variant => (
                      <div 
                        key={variant.id}
                        className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 items-center border-t"
                      >
                        <div>
                          <Label htmlFor={`image-${variant.id}`} className="cursor-pointer">
                            {variant.imageUrl ? (
                              <img src={getImageUrl(variant.imageUrl)} alt="Variant" className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </Label>
                          <Input
                            id={`image-${variant.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, variant.id)}
                          />
                        </div>
                        <div>{Object.entries(variant.attributes).map(([key, value]) => `${value}`).join(' / ')}</div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => onUpdateVariantField(variant.id, 'price', e.target.value)}
                            className="w-32"
                            step="0.01"
                          />
                          <span className="text-sm text-muted-foreground">PEN</span>
                        </div>
                        <Input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => onUpdateVariantField(variant.id, 'quantity', parseInt(e.target.value))}
                          className="w-32"
                        />
                        <div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t text-sm text-muted-foreground">
            Inventario total: {getTotalInventory()} disponible
          </div>
        </div>
      )}
    </div>
  )
}

3