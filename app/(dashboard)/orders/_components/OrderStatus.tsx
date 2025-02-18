import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import { translateEnum } from "@/lib/translations"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"

interface OrderStatusProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
}

export function OrderStatus({ formData, setFormData }: OrderStatusProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="financialStatus">Financial Status</Label>
        <Select
          value={formData.financialStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, financialStatus: value as OrderFinancialStatus }))
          }
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select financial status" />
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
        <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
        <Select
          value={formData.fulfillmentStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, fulfillmentStatus: value as OrderFulfillmentStatus }))
          }
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select fulfillment status" />
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
        <Label htmlFor="shippingStatus">Shipping Status</Label>
        <Select
          value={formData.shippingStatus}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingStatus: value as ShippingStatus }))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select shipping status" />
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

