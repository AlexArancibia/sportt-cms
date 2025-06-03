"use client"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/app/(dashboard)/contents/_components/RichTextEditor"

interface BasicFormProps {
  productData: {
    name?: string
    description?: string
    price?: number
    quantity?: number
    sku?: string
  }
  onChange: (field: string, value: string | number) => void
}

export function BasicForm({ productData, onChange }: BasicFormProps) {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" value={productData.sku} onChange={(e) => onChange("sku", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Precio</Label>
          <div className="relative">
            <Input
              id="basePrice"
              type="number"
              value={productData.price || ""}
              onChange={(e) => onChange("price", Number.parseFloat(e.target.value) || 0)}
              step="0.01"
              className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseQuantity">Cantidad</Label>
          <Input
            id="baseQuantity"
            type="number"
            value={productData.quantity || ""}
            onChange={(e) => onChange("quantity", Number.parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <RichTextEditor content={productData.description || ""} onChange={(html) => onChange("description", html)} />
      </div>
    </section>
  )
}
