import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon } from 'lucide-react'

interface CustomerFormProps {
  customer?: Customer
  onSuccess: () => void
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { createCustomer, updateCustomer } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCustomerDto | UpdateCustomerDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: null,
    address: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        password: '', // No mostramos la contraseña existente por seguridad
      })
    }
  }, [customer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? (value === '' ? null : parseInt(value)) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (customer) {
        // Si estamos actualizando y no se proporciona una nueva contraseña, no la incluimos en la actualización
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
        await createCustomer(formData as CreateCustomerDto)
        toast({
          title: "Success",
          description: "Customer created successfully",
        })
      }
      onSuccess()
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: customer ? "Failed to update customer" : "Failed to create customer",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          type="number"
          value={formData.phone === null ? '' : formData.phone}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>
      <div className="relative">
        <Label htmlFor="password">
          {customer ? 'New Password (leave blank to keep current)' : 'Password'}
        </Label>
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required={!customer}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-8 text-gray-500"
        >
          {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
      <Button type="submit">{customer ? 'Update' : 'Create'} Customer</Button>
    </form>
  )
}

