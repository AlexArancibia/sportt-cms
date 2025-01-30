import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { Coupon, CreateCouponDto, UpdateCouponDto, DiscountType } from "@/types/coupon"

interface CouponFormProps {
  coupon?: Coupon
  onSuccess: () => void
}

export function CouponForm({ coupon, onSuccess }: CouponFormProps) {
  const router = useRouter()
  const { createCoupon, updateCoupon, products, categories, collections } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCouponDto>({
    code: "",
    description: "",
    type: DiscountType.PERCENTAGE,
    value: 0,
    minPurchase: 0,
    maxUses: 0,
    usedCount: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    isActive: true,
    applicableProductIds: [],
    applicableCategoryIds: [],
    applicableCollectionIds: [],
  })

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase || 0,
        maxUses: coupon.maxUses || 0,
        usedCount: coupon.usedCount,
        startDate: new Date(coupon.startDate).toISOString().split("T")[0],
        endDate: new Date(coupon.endDate).toISOString().split("T")[0],
        isActive: coupon.isActive,
        applicableProductIds: coupon.applicableProducts?.map((p) => p.id) || [],
        applicableCategoryIds: coupon.applicableCategories?.map((c) => c.id) || [],
        applicableCollectionIds: coupon.applicableCollections?.map((c) => c.id) || [],
      })
    }
  }, [coupon])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (coupon) {
        const updateData: UpdateCouponDto = {
          ...formData,
          endDate: formData.endDate || undefined,
        }
        await updateCoupon(coupon.id, updateData)
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        })
      } else {
        await createCoupon(formData)
        toast({
          title: "Success",
          description: "Coupon created successfully",
        })
      }
      onSuccess()
      router.push("/coupons")
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
        <Input id="code" name="code" value={formData.code} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as DiscountType }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DiscountType.PERCENTAGE}>Percentage</SelectItem>
            <SelectItem value={DiscountType.FIXED_AMOUNT}>Fixed Amount</SelectItem>
            <SelectItem value={DiscountType.BUY_X_GET_Y}>Buy X Get Y</SelectItem>
            <SelectItem value={DiscountType.FREE_SHIPPING}>Free Shipping</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="value">Value</Label>
        <Input id="value" name="value" type="number" value={formData.value} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="minPurchase">Minimum Purchase</Label>
        <Input id="minPurchase" name="minPurchase" type="number" value={formData.minPurchase} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="maxUses">Maximum Uses</Label>
        <Input id="maxUses" name="maxUses" type="number" value={formData.maxUses} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="usedCount">Used Count</Label>
        <Input
          id="usedCount"
          name="usedCount"
          type="number"
          value={formData.usedCount}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <DatePicker
          date={formData.startDate ? new Date(formData.startDate) : undefined}
          setDate={(date) => setFormData((prev) => ({ ...prev, startDate: date?.toISOString().split("T")[0] || "" }))}
        />
      </div>
      <div>
        <Label htmlFor="endDate">End Date</Label>
        <DatePicker
          date={formData.endDate ? new Date(formData.endDate) : undefined}
          setDate={(date) => setFormData((prev) => ({ ...prev, endDate: date?.toISOString().split("T")[0] || "" }))}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: !!checked }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <div>
        <Label>Applicable Products</Label>
        <MultiSelect
          options={products.map((p) => ({ label: p.title, value: p.id }))}
          selected={formData.applicableProductIds}
          onChange={(selected) => setFormData((prev) => ({ ...prev, applicableProductIds: selected }))}
        />
      </div>
      <div>
        <Label>Applicable Categories</Label>
        <MultiSelect
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
          selected={formData.applicableCategoryIds}
          onChange={(selected) => setFormData((prev) => ({ ...prev, applicableCategoryIds: selected }))}
        />
      </div>
      <div>
        <Label>Applicable Collections</Label>
        <MultiSelect
          options={collections.map((c) => ({ label: c.title, value: c.id }))}
          selected={formData.applicableCollectionIds}
          onChange={(selected) => setFormData((prev) => ({ ...prev, applicableCollectionIds: selected }))}
        />
      </div>
      <Button type="submit">{coupon ? "Update" : "Create"} Coupon</Button>
    </form>
  )
}

