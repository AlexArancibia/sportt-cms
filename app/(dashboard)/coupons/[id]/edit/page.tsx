"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { UpdateCouponDto,Coupon } from "@/types/coupon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { DiscountType } from "@/types/common"

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { updateCoupon, fetchCoupons, products, categories, collections } = useMainStore()

  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCoupon = async () => {
      try {
        const fetchedCoupons = await fetchCoupons()
        const foundCoupon = fetchedCoupons.find((c) => c.id === resolvedParams.id)
        if (foundCoupon) {
          setCoupon(foundCoupon)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Coupon not found.",
          })
        }
      } catch (error) {
        console.error("Error fetching coupons:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch coupons. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCoupon()
  }, [fetchCoupons, resolvedParams.id, toast])

  const handleUpdateCoupon = async () => {
    if (!coupon) return

    try {
      const updatedCoupon: UpdateCouponDto = {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxUses: coupon.maxUses,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        isActive: coupon.isActive,
        applicableProductIds: coupon.applicableProducts?.map((p) => p.id) || [],
        applicableCategoryIds: coupon.applicableCategories?.map((c) => c.id) || [],
        applicableCollectionIds: coupon.applicableCollections?.map((c) => c.id) || [],
      }

      await updateCoupon(resolvedParams.id, updatedCoupon)
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      })
      router.push("/coupons")
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update coupon. Please try again.",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!coupon) {
    return <div>Coupon not found</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdateCoupon()
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={coupon.code}
                onChange={(e) => setCoupon((prev) => ({ ...prev!, code: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={coupon.description}
                onChange={(e) => setCoupon((prev) => ({ ...prev!, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={coupon.type}
                onValueChange={(value) => setCoupon((prev) => ({ ...prev!, type: value as DiscountType }))}
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
              <Input
                id="value"
                type="number"
                value={coupon.value}
                onChange={(e) => setCoupon((prev) => ({ ...prev!, value: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="minPurchase">Minimum Purchase</Label>
              <Input
                id="minPurchase"
                type="number"
                value={coupon.minPurchase || 0}
                onChange={(e) => setCoupon((prev) => ({ ...prev!, minPurchase: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                value={coupon.maxUses || 0}
                onChange={(e) => setCoupon((prev) => ({ ...prev!, maxUses: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Applicable Products</Label>
              <MultiSelect
                options={products.map((p) => ({ label: p.title, value: p.id }))}
                selected={coupon.applicableProducts?.map((p) => p.id)}
                onChange={(selected) =>
                  setCoupon((prev) => ({
                    ...prev!,
                    applicableProducts: products.filter((p) => selected.includes(p.id)),
                  }))
                }
              />
            </div>
            <div>
              <Label>Applicable Categories</Label>
              <MultiSelect
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                selected={coupon.applicableCategories?.map((c) => c.id)}
                onChange={(selected) =>
                  setCoupon((prev) => ({
                    ...prev!,
                    applicableCategories: categories.filter((c) => selected.includes(c.id)),
                  }))
                }
              />
            </div>
            <div>
              <Label>Applicable Collections</Label>
              <MultiSelect
                options={collections.map((c) => ({ label: c.title, value: c.id }))}
                selected={coupon.applicableCollections?.map((c) => c.id)}
                onChange={(selected) =>
                  setCoupon((prev) => ({
                    ...prev!,
                    applicableCollections: collections.filter((c) => selected.includes(c.id)),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <DatePicker
              date={coupon.startDate}
              setDate={(date) =>
                setCoupon((prev) => ({
                  ...prev!,
                  startDate: date ?? prev!.startDate, // fallback opcional si date es null
                }))
              }
            />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <DatePicker
                date={coupon.endDate}
                setDate={(date) =>
                  setCoupon((prev) => ({
                    ...prev!,
                    endDate: date ?? prev!.endDate,
                  }))
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={coupon.isActive}
                onCheckedChange={(checked) => setCoupon((prev) => ({ ...prev!, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <Button type="submit">Update Coupon</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

