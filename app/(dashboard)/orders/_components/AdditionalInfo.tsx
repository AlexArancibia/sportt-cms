"use client"

import type React from "react"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"

interface AdditionalInfoProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
}

export const AdditionalInfo = memo(function AdditionalInfo({ formData, setFormData }: AdditionalInfoProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Adicional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-notes">Notas del Cliente</Label>
          <Textarea
            id="customer-notes"
            value={formData.customerNotes || ""}
            onChange={(e) => handleChange("customerNotes", e.target.value)}
            placeholder="Notas o instrucciones especiales del cliente"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal-notes">Notas Internas</Label>
          <Textarea
            id="internal-notes"
            value={formData.internalNotes || ""}
            onChange={(e) => handleChange("internalNotes", e.target.value)}
            placeholder="Notas internas para el equipo (no visibles para el cliente)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Origen del Pedido</Label>
          <Input
            id="source"
            value={formData.source || ""}
            onChange={(e) => handleChange("source", e.target.value)}
            placeholder="web, tienda, teléfono, etc."
          />
        </div>
      </CardContent>
    </Card>
  )
})
