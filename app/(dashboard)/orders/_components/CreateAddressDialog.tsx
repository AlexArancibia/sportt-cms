import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import type { Address, CreateAddressDto } from "@/types/address"
import type { UpdateCustomerDto } from "@/types/customer"

interface CreateAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  onAddressCreated: (address: Address) => void
}

export function CreateAddressDialog({ open, onOpenChange, customerId, onAddressCreated }: CreateAddressDialogProps) {
  const [address, setAddress] = useState<CreateAddressDto>({
    company: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "",
    phone: "",
    isDefault: false,
  })
  const { toast } = useToast()
  const { updateCustomer } = useMainStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updateData: UpdateCustomerDto = {
        addresses: [address],
      }
      const updatedCustomer = await updateCustomer(customerId, updateData)
      if (updatedCustomer.addresses && updatedCustomer.addresses.length > 0) {
        const newAddress = updatedCustomer.addresses[updatedCustomer.addresses.length - 1]
        toast({
          title: "Success",
          description: "Address added successfully",
        })
        onAddressCreated(newAddress)
        onOpenChange(false)
      } else {
        throw new Error("Failed to add address: No addresses returned")
      }
    } catch (error) {
      console.error("Failed to add address:", error)
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Address</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
 
 
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" value={address.company} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="address1">Address Line 1</Label>
            <Input id="address1" name="address1" value={address.address1} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="address2">Address Line 2</Label>
            <Input id="address2" name="address2" value={address.address2} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={address.city} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="province">Province/State</Label>
            <Input id="province" name="province" value={address.province} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP/Postal Code</Label>
            <Input id="zip" name="zip" value={address.zip} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={address.country} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={address.phone} onChange={handleChange} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              name="isDefault"
              checked={address.isDefault}
              onCheckedChange={(checked) => setAddress((prev) => ({ ...prev, isDefault: checked as boolean }))}
            />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>
          <Button type="submit">Create Address</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

