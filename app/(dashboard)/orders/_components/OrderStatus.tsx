import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import { translateEnum } from "@/lib/translations"
import type { OrderFormState } from "./orderFormTypes"

interface OrderStatusProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
}

export function OrderStatus({ formData, setFormData }: OrderStatusProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="financialStatus" className="text-sm font-medium text-muted-foreground">
          Estado financiero
        </Label>
        <Select
          value={formData.financialStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, financialStatus: value as OrderFinancialStatus }))
          }
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Seleccionar estado financiero" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(OrderFinancialStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {translateEnum(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fulfillmentStatus" className="text-sm font-medium text-muted-foreground">
          Estado de cumplimiento
        </Label>
        <Select
          value={formData.fulfillmentStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, fulfillmentStatus: value as OrderFulfillmentStatus }))
          }
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Seleccionar estado de cumplimiento" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(OrderFulfillmentStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {translateEnum(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shippingStatus" className="text-sm font-medium text-muted-foreground">
          Estado de envío
        </Label>
        <Select
          value={formData.shippingStatus}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingStatus: value as ShippingStatus }))}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Seleccionar estado de envío" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ShippingStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {translateEnum(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

