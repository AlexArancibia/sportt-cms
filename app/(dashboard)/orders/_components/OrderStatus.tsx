import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import { translateEnum } from "@/lib/translations"
import type { OrderFormState } from "./orderFormTypes"

interface OrderStatusProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
  readOnly?: boolean
}

export function OrderStatus({ formData, setFormData, readOnly = false }: OrderStatusProps) {
  if (readOnly) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Estado del pedido</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado financiero</p>
            <Badge variant="outline" className="font-normal">
              {formData.financialStatus ? translateEnum(formData.financialStatus) : "—"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado de cumplimiento</p>
            <Badge variant="outline" className="font-normal">
              {formData.fulfillmentStatus ? translateEnum(formData.fulfillmentStatus) : "—"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado de envío</p>
            <Badge variant="outline" className="font-normal">
              {formData.shippingStatus ? translateEnum(formData.shippingStatus) : "—"}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

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

