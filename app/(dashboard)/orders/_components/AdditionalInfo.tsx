import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"

interface AdditionalInfoProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
}

export function AdditionalInfo({ formData, setFormData }: AdditionalInfoProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6 p-6 pt-0">
      <div className="space-y-2">
        <Label htmlFor="customerNotes">Notas del Cliente</Label>
        <Input
          id="customerNotes"
          name="customerNotes"
          value={formData.customerNotes}
          onChange={handleChange}
          readOnly
          className="cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Notas Internas</Label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          value={formData.internalNotes}
          onChange={handleChange}
          className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
          rows={4}
        />
      </div>
    </div>
  )
}

