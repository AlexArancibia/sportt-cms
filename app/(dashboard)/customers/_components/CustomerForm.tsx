'use client'

import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer'
import { CreateCustomerAddressDto, UpdateCustomerAddressDto, CustomerAddress } from '@/types/customerAddress'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { EyeIcon, EyeOffIcon, PlusCircleIcon, TrashIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { createCustomer, updateCustomer, loading: storeLoading } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCustomerDto | UpdateCustomerDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    acceptsMarketing: false,
    addresses: [],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log("CustomerForm useEffect triggered with customer:", customer);
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email,
        phone: customer.phone || '',
        acceptsMarketing: customer.acceptsMarketing,
        addresses: customer.addresses || [],
      })
    }
  }, [customer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { address1: '', address2: '', city: '', province: '', country: '', zip: '' } as CreateCustomerAddressDto]
    }))
  }

  const handleAddressChange = (index: number, field: keyof CustomerAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: (prev.addresses || []).map((address, i) =>
        i === index ? { ...address, [field]: value } : address
      )
    }))
  }

  const handleRemoveAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: (prev.addresses || []).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("CustomerForm handleSubmit triggered with formData:", formData);

    try {
      if (customer) {
        const updateData: UpdateCustomerDto = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await updateCustomer(customer.id, updateData)
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
      } else {
        console.log("Creating customer with data:", formData);
        const newCustomerData = { ...formData } as CreateCustomerDto;
        if (newCustomerData.addresses && newCustomerData.addresses.length === 0) {
          delete newCustomerData.addresses; // Remove empty addresses array
        }
        await createCustomer(newCustomerData)
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      }
      onSuccess()
    } catch (error: any) {
      console.error("Error creating or updating customer:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: customer ? `Failed to update customer: ${error.message}` : `Failed to create customer: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  if (storeLoading && customer) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{customer ? 'Edit' : 'Create'} Customer</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone as string}
              onChange={handleChange}
            />
          </div>
          {!customer && (
            <div className="relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password as string}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-300 dark:text-gray-400"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptsMarketing"
              name="acceptsMarketing"
              checked={formData.acceptsMarketing}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptsMarketing: !!checked }))}
            />
            <Label htmlFor="acceptsMarketing">Accepts Marketing</Label>
          </div>

          <div>
            <Label>Addresses</Label>
            {(formData.addresses || []).map((address, index) => (
              <div key={index} className="mt-2 p-4 border rounded flex items-center justify-between">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Input
                    placeholder="Address 1"
                    value={address.address1}
                    onChange={(e) => handleAddressChange(index, 'address1', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Address 2"
                    value={address.address2 || ''}
                    onChange={(e) => handleAddressChange(index, 'address2', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Province"
                    value={address.province}
                    onChange={(e) => handleAddressChange(index, 'province', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="ZIP"
                    value={address.zip}
                    onChange={(e) => handleAddressChange(index, 'zip', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveAddress(index)}
                  className="ml-4"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant='outline' onClick={handleAddAddress} className="mt-2">
              <PlusCircleIcon className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>

          <Button type="submit" disabled={loading} className={cn(
            "w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200",
            loading && "cursor-not-allowed opacity-50"
          )}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              customer ? 'Update Customer' : 'Create Customer'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

