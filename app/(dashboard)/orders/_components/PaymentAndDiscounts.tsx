import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import { PaymentProvider } from "@/types/payments"
 

interface PaymentAndDiscountsProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  paymentProviders: PaymentProvider[]
}

export function PaymentAndDiscounts({ formData, setFormData, paymentProviders }: PaymentAndDiscountsProps) {
  return (
    <div className="space-y-6 px-6">
      <div className="space-y-2 flex flex-col">
        <Label htmlFor="preferredDeliveryDate" className="mb-1">
          Fecha de envío preferida
        </Label>
        <DatePicker
          date={formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate) : undefined}
          setDate={(date) => setFormData((prev) => ({ ...prev, preferredDeliveryDate: date?.toISOString() }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentProviderId" className="">
          Metodo de Pago
        </Label>
        <Select
          value={formData.paymentProviderId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentProviderId: value }))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Seleccione metodo de pago" />
          </SelectTrigger>
          <SelectContent>
            {paymentProviders.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

