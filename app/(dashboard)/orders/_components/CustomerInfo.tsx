import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserIcon } from "lucide-react"
import type { Customer } from "@/types/customer"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"

interface CustomerInfoProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  customers: Customer[]
  setIsUserDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function CustomerInfo({ formData, setFormData, customers, setIsUserDialogOpen }: CustomerInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerId">Cliente</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.customerId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, customerId: value }))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsUserDialogOpen(true)}>
            <UserIcon className="w-4 h-4 mr-2" />
            New Customer
          </Button>
        </div>
      </div>
    </div>
  )
}

