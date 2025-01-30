import { useState, useCallback } from "react"
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/types/customer"
import type { CreateAddressDto } from "@/types/address"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2 } from "lucide-react"

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit }) => {
  const [formData, setFormData] = useState<CreateCustomerDto | UpdateCustomerDto>({
    email: customer?.email || "",
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    phone: customer?.phone || "",
    password: "",
    acceptsMarketing: customer?.acceptsMarketing || false,
    addresses:
      customer?.addresses?.map((addr) => ({
        isDefault: addr.isDefault || false,
        company: addr.company || "",
        address1: addr.address1,
        address2: addr.address2 || "",
        city: addr.city,
        province: addr.province || "",
        zip: addr.zip,
        country: addr.country,
        phone: addr.phone || "",
      })) || [],
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }, [])

  const handleAddressChange = (index: number, field: keyof CreateAddressDto, value: string) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses?.map((address, i) => (i === index ? { ...address, [field]: value } : address)) || [],
    }))
  }

  const handleAddAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...(prev.addresses || []),
        {
          isDefault: false,
          company: "",
          address1: "",
          address2: "",
          city: "",
          province: "",
          zip: "",
          country: "",
          phone: "",
        },
      ],
    }))
  }

  const handleRemoveAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{customer ? "Edit" : "Create"} Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
          </div>
          {!customer && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={(formData as CreateCustomerDto).password || ""}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptsMarketing"
              name="acceptsMarketing"
              checked={formData.acceptsMarketing}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptsMarketing: !!checked }))}
            />
            <Label htmlFor="acceptsMarketing">Accepts Marketing</Label>
          </div>

          <div>
            <Label>Addresses</Label>
            {formData.addresses?.map((address, index) => (
              <div key={index} className="mt-2 p-4 border rounded flex items-center justify-between">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Input
                    placeholder="Company"
                    value={address.company || ""}
                    onChange={(e) => handleAddressChange(index, "company", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Address 1"
                    value={address.address1}
                    onChange={(e) => handleAddressChange(index, "address1", e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Input
                    placeholder="Address 2"
                    value={address.address2 || ""}
                    onChange={(e) => handleAddressChange(index, "address2", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Input
                    placeholder="Province"
                    value={address.province || ""}
                    onChange={(e) => handleAddressChange(index, "province", e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="ZIP"
                    value={address.zip}
                    onChange={(e) => handleAddressChange(index, "zip", e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange(index, "country", e.target.value)}
                    className="mb-2"
                    required
                  />
                  <Input
                    placeholder="Phone"
                    value={address.phone || ""}
                    onChange={(e) => handleAddressChange(index, "phone", e.target.value)}
                    className="mb-2"
                  />
                </div>
                <Button type="button" variant="ghost" onClick={() => handleRemoveAddress(index)} className="ml-4">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddAddress} className="mt-2">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>

          <Button type="submit" className="w-full">
            {customer ? "Update Customer" : "Create Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CustomerForm

