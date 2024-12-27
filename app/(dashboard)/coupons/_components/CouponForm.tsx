import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Coupon, CreateCouponDto, UpdateCouponDto } from '@/types/coupon'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface CouponFormProps {
  coupon?: Coupon
  onSuccess: () => void
}

export function CouponForm({ coupon, onSuccess }: CouponFormProps) {
  const { createCoupon, updateCoupon } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCouponDto>({
    code: '',
    description: '',
    discount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    conditions: {} // Ensure conditions is always present
  })

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discount: coupon.discount,
        startDate: new Date(coupon.startDate).toISOString().split('T')[0],
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
        isActive: coupon.isActive,
        conditions: coupon.conditions
      })
    }
  }, [coupon])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const couponData: Omit<Coupon, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        conditions: typeof formData.conditions === 'string' 
          ? JSON.parse(formData.conditions) 
          : formData.conditions || {} // Ensure conditions is always an object
      }

      if (coupon) {
        const updateData: UpdateCouponDto = {
          ...couponData,
          endDate: couponData.endDate || undefined // Make sure endDate is undefined if empty string
        }
        await updateCoupon(coupon.id, updateData)
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        })
      } else {
        await createCoupon(couponData)
        toast({
          title: "Success",
          description: "Coupon created successfully",
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: coupon ? "Failed to update coupon" : "Failed to create coupon",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="discount">Discount (%)</Label>
        <Input
          id="discount"
          name="discount"
          type="number"
          min="0"
          max="100"
          value={formData.discount}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="endDate">End Date (optional)</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="conditions">Conditions (JSON)</Label>
        <Textarea
          id="conditions"
          name="conditions"
          value={typeof formData.conditions === 'string' ? formData.conditions : JSON.stringify(formData.conditions, null, 2)}
          onChange={handleChange}
          placeholder="Enter conditions as JSON"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <Button type="submit">{coupon ? 'Update' : 'Create'} Coupon</Button>
    </form>
  )
}

