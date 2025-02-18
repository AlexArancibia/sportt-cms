import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import type { Customer } from "@/types/customer"

interface ShippingAndBillingProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  customers: Customer[]
  setIsAddressDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function ShippingAndBilling({
  formData,
  setFormData,
  customers,
  setIsAddressDialogOpen,
}: ShippingAndBillingProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shippingAddressId">Shipping Address</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.shippingAddressId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingAddressId: value }))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select shipping address" />
            </SelectTrigger>
            <SelectContent>
              {customers
                .find((c) => c.id === formData.customerId)
                ?.addresses?.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.address1}, {address.city}, {address.country}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsAddressDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Address
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="billingAddressId">Billing Address</Label>
        <Select
          value={formData.billingAddressId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, billingAddressId: value }))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select billing address" />
          </SelectTrigger>
          <SelectContent>
            {customers
              .find((c) => c.id === formData.customerId)
              ?.addresses?.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  {address.address1}, {address.city}, {address.country}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

