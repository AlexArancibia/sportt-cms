"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VariantImageGallery } from "./VariantImageGallery"
import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { CreateProductVariantDto } from "@/types/productVariant"

type VariantDto = UpdateProductVariantDto | CreateProductVariantDto

interface VariantsTableProps<T extends VariantDto> {
  variants: T[]
  useVariants: boolean
  shopSettings: any[]
  productImages?: string[]
  onVariantChange: (indexOrId: number | string, field: keyof T, value: any) => void
  onWeightChange: (indexOrId: number | string, value: string) => void
  onInventoryChange: (indexOrId: number | string, value: string) => void
  onInventoryBlur: (indexOrId: number | string, value: string) => void
  onPriceChange: (indexOrId: number | string, currencyId: string, value: string) => void
  onImageUpload: (indexOrId: number | string) => void
  onImageRemove: (indexOrId: number | string, imageIndex: number) => void
  onProductImageRemove?: (imageIndex: number) => void
  mode?: "create" | "edit"
}

export function VariantsTable<T extends VariantDto>({
  variants,
  useVariants,
  shopSettings,
  productImages = [],
  onVariantChange,
  onWeightChange,
  onInventoryChange,
  onInventoryBlur,
  onPriceChange,
  onImageUpload,
  onImageRemove,
  onProductImageRemove,
  mode = "create",
}: VariantsTableProps<T>) {
  const getIdentifier = (variant: T, index: number) => {
    return mode === "edit" ? (variant as any).id : index
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="p-0 pl-6 w-[500px]">Nombre</TableHead>
          <TableHead className="pl-2 w-[250px]">SKU</TableHead>
          <TableHead className="pl-2 w-[100px]">Peso</TableHead>
          <TableHead className="pl-2 w-[100px]">Cantidad</TableHead>
          {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
            <TableHead className="p-0 pl-2 w-[100px]" key={currency.id}>
              Precio ({currency.code})
            </TableHead>
          ))}
          {useVariants && <TableHead className="p-0 pl-2">Atributos</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant, index) => {
          const identifier = getIdentifier(variant, index)
          const images = useVariants ? (variant.imageUrls || []) : productImages
          const maxImages = useVariants ? 5 : 10

          return (
            <TableRow key={index} className={variant.isActive ? "" : "opacity-50"}>
              <TableCell className="pl-6">
                <div className="flex items-center gap-1">
                  <div className="flex items-start gap-2 mr-2">
                    <VariantImageGallery
                      images={images}
                      maxImages={maxImages}
                      onUpload={() => onImageUpload(identifier)}
                      onRemove={(imageIndex) =>
                        useVariants
                          ? onImageRemove(identifier, imageIndex)
                          : onProductImageRemove?.(imageIndex)
                      }
                      variantTitle={variant.title || "Product"}
                    />
                  </div>
                  <Input
                    value={variant.title || ""}
                    onChange={(e) => onVariantChange(identifier, "title" as keyof T, e.target.value)}
                    className="border-0 p-2"
                  />
                </div>
              </TableCell>
              <TableCell>
                <Input
                  value={variant.sku || ""}
                  onChange={(e) => onVariantChange(identifier, "sku" as keyof T, e.target.value)}
                  className="border-0 p-2"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.weightValue === undefined ? "" : variant.weightValue}
                  onChange={(e) => onWeightChange(identifier, e.target.value)}
                  className="border-0 p-2"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={variant.inventoryQuantity ?? ""}
                  onChange={(e) => onInventoryChange(identifier, e.target.value)}
                  onBlur={(e) => onInventoryBlur(identifier, e.target.value)}
                  placeholder="0"
                  className="border-0 p-2"
                />
              </TableCell>
              {shopSettings?.[0]?.acceptedCurrencies?.map((currency: any) => (
                <TableCell key={currency.id}>
                  <Input
                    type="number"
                    step="1"
                    value={variant.prices?.find((p: any) => p.currencyId === currency.id)?.price || ""}
                    onChange={(e) => onPriceChange(identifier, currency.id, e.target.value)}
                    className="border-0 p-2"
                  />
                </TableCell>
              ))}
              {useVariants && (
                <TableCell>
                  <div className="flex flex-wrap gap-1 text-sm">
                    {Object.entries(variant.attributes || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

