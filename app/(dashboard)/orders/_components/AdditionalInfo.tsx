"use client"

import type React from "react"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { OrderFormState } from "./orderFormTypes"

interface AdditionalInfoProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
}

export const AdditionalInfo = memo(function AdditionalInfo({ formData, setFormData }: AdditionalInfoProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Card className="border-border/30 bg-card/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">Información adicional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-notes" className="text-sm font-medium text-muted-foreground">
            Notas del cliente
          </Label>
          <Textarea
            id="customer-notes"
            value={formData.customerNotes || ""}
            onChange={(e) => handleChange("customerNotes", e.target.value)}
            placeholder="Notas o instrucciones especiales del cliente"
            rows={3}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal-notes" className="text-sm font-medium text-muted-foreground">
            Notas internas
          </Label>
          <Textarea
            id="internal-notes"
            value={formData.internalNotes || ""}
            onChange={(e) => handleChange("internalNotes", e.target.value)}
            placeholder="Notas internas para el equipo (no visibles para el cliente)"
            rows={3}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source" className="text-sm font-medium text-muted-foreground">
            Origen del pedido
          </Label>
          <Input
            id="source"
            value={formData.source || ""}
            onChange={(e) => handleChange("source", e.target.value)}
            placeholder="web, tienda, teléfono, etc."
            className="bg-background"
          />
        </div>
      </CardContent>
    </Card>
  )
})
