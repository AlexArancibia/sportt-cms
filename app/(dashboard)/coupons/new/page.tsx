"use client"

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
import {  CreateCouponDto } from "@/types/coupon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { HeaderBar } from "@/components/HeaderBar"
import { DiscountType } from "@/types/common"

export default function NewCouponPage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    createCoupon,
    products,
    categories,
    collections,
    fetchProductsByStore,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    currentStore,
  } = useMainStore()

  const [newCoupon, setNewCoupon] = useState<CreateCouponDto>({
    code: "",
    description: "",
    type: DiscountType.PERCENTAGE,
    value: 0,
    minPurchase: 0,
    maxUses: 0,
    startDate: new Date(),
    endDate: new Date(),
    isActive: true,
    storeId: currentStore || "", // Initialize with currentStore
    applicableProductIds: [],
    applicableCategoryIds: [],
    applicableCollectionIds: [],
  })

  // Fetch products, categories, and collections by store when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProductsByStore(), fetchCategoriesByStore(currentStore, { limit: 50 }), fetchCollectionsByStore()])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data. Please try again.",
        })
      }
    }

    fetchData()

    // Update storeId when currentStore changes
    if (currentStore) {
      setNewCoupon((prev) => ({
        ...prev,
        storeId: currentStore,
      }))
    }
  }, [fetchProductsByStore, fetchCategoriesByStore, fetchCollectionsByStore, toast, currentStore])

  const handleCreateCoupon = async () => {
    try {
      // Ensure storeId is set
      const couponToCreate = {
        ...newCoupon,
        storeId: currentStore || newCoupon.storeId,
      }

      await createCoupon(couponToCreate)
      toast({
        title: "Success",
        description: "Coupon created successfully",
      })
      router.push("/coupons")
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create coupon. Please try again.",
      })
    }
  }

  return (
    <>
      <HeaderBar title="Create New Coupon" />
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateCoupon()
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="storeId">Store ID</Label>
                <Input
                  id="storeId"
                  value={newCoupon.storeId}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, storeId: e.target.value }))}
                  required
                  disabled={!!currentStore} // Disable if currentStore is set
                />
                {!newCoupon.storeId && (
                  <p className="text-sm text-red-500 mt-1">
                    Please select a store or ensure you have a current store selected.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newCoupon.type}
                  onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, type: value as DiscountType }))}
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
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minPurchase">Minimum Purchase</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={newCoupon.minPurchase}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, minPurchase: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Applicable Products</Label>
                <MultiSelect
                  options={products.map((p) => ({ label: p.title, value: p.id }))}
                  selected={newCoupon.applicableProductIds}
                  onChange={(selected) => setNewCoupon((prev) => ({ ...prev, applicableProductIds: selected }))}
                />
              </div>
              <div>
                <Label>Applicable Categories</Label>
                <MultiSelect
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  selected={newCoupon.applicableCategoryIds}
                  onChange={(selected) => setNewCoupon((prev) => ({ ...prev, applicableCategoryIds: selected }))}
                />
              </div>
              <div>
                <Label>Applicable Collections</Label>
                <MultiSelect
                  options={collections.map((c) => ({ label: c.title, value: c.id }))}
                  selected={newCoupon.applicableCollectionIds}
                  onChange={(selected) => setNewCoupon((prev) => ({ ...prev, applicableCollectionIds: selected }))}
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker
                  date={newCoupon.startDate instanceof Date ? newCoupon.startDate : new Date(newCoupon.startDate)}
                  setDate={(date) => setNewCoupon((prev) => ({ ...prev, startDate: date || new Date() }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker
                  date={newCoupon.endDate instanceof Date ? newCoupon.endDate : new Date(newCoupon.endDate)}
                  setDate={(date) => setNewCoupon((prev) => ({ ...prev, endDate: date || new Date() }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={newCoupon.isActive}
                  onCheckedChange={(checked) => setNewCoupon((prev) => ({ ...prev, isActive: checked as boolean }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit">Create Coupon</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
