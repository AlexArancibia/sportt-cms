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
import { type UpdateCouponDto, type Coupon } from "@/types/coupon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { HeaderBar } from "@/components/HeaderBar"
import { Loader2 } from "lucide-react"
import { DiscountType } from "@/types/common"

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const {
    updateCoupon,
    fetchCouponsByStore,
    products,
    categories,
    collections,
    fetchProductsByStore,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    currentStore,
  } = useMainStore()

  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Fetch all required data by store
        await Promise.all([fetchProductsByStore(), fetchCategoriesByStore(currentStore || undefined, { limit: 50 }), fetchCollectionsByStore()])

        // Fetch coupons by store
        const fetchedCoupons = await fetchCouponsByStore()
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
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [
    fetchCouponsByStore,
    fetchProductsByStore,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    resolvedParams.id,
    toast,
  ])

  const handleUpdateCoupon = async () => {
    if (!coupon) return

    try {
      const updatedCoupon: UpdateCouponDto = {
        code: coupon.code.toUpperCase(),
        description: coupon.description,
        type: coupon.type,
        value:
          coupon.type === DiscountType.FREE_SHIPPING
            ? Math.max(Number(coupon.value) || 0, 1)
            : Number(coupon.value),
        startDate: coupon.startDate instanceof Date ? coupon.startDate : new Date(coupon.startDate),
        endDate: coupon.endDate instanceof Date ? coupon.endDate : new Date(coupon.endDate),
        isActive: coupon.isActive,
        applicableProductIds: coupon.applicableProducts?.map((p) => p.id) || undefined,
        applicableCategoryIds: coupon.applicableCategories?.map((c) => c.id) || undefined,
        applicableCollectionIds: coupon.applicableCollections?.map((c) => c.id) || undefined,
        minPurchase:
          coupon.minPurchase && coupon.minPurchase > 0 ? Number(coupon.minPurchase) : undefined,
        maxUses: coupon.maxUses && coupon.maxUses > 0 ? Number(coupon.maxUses) : undefined,
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
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!coupon) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Card>
          <CardContent className="pt-6">
            <p>Coupon not found. The coupon may have been deleted or you may not have access to it.</p>
            <Button className="mt-4" onClick={() => router.push("/coupons")}>
              Return to Coupons
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <HeaderBar title="Edit Coupon" />
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Edit Coupon: {coupon.code}</CardTitle>
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
                  value={coupon.description || ""}
                  onChange={(e) => setCoupon((prev) => ({ ...prev!, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="storeId">Store ID</Label>
                <Input id="storeId" value={coupon.storeId} disabled className="bg-gray-100" />
                <p className="text-sm text-gray-500 mt-1">Store ID cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={coupon.type}
                  onValueChange={(value) =>
                    setCoupon((prev) => ({
                      ...prev!,
                      type: value as DiscountType,
                      value:
                        value === DiscountType.FREE_SHIPPING
                          ? Math.max((prev?.value ?? 0), 1)
                          : prev?.value ?? 1,
                    }))
                  }
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
                  onChange={(e) =>
                    setCoupon((prev) => ({
                      ...prev!,
                      value:
                        prev?.type === DiscountType.FREE_SHIPPING
                          ? Math.max(Number(e.target.value) || 0, 1)
                          : Number(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="minPurchase">Minimum Purchase</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={coupon.minPurchase ?? ""}
                  onChange={(e) =>
                    setCoupon((prev) => ({
                      ...prev!,
                      minPurchase: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={coupon.maxUses ?? ""}
                  onChange={(e) =>
                    setCoupon((prev) => ({
                      ...prev!,
                      maxUses: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Applicable Products</Label>
                <MultiSelect
                  options={products.map((p) => ({ label: p.title, value: p.id }))}
                  selected={coupon.applicableProducts?.map((p) => p.id) || []}
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
                  selected={coupon.applicableCategories?.map((c) => c.id) || []}
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
                  selected={coupon.applicableCollections?.map((c) => c.id) || []}
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
                  date={coupon.startDate ? new Date(coupon.startDate) : undefined}
                  setDate={(date) => setCoupon((prev) => ({ ...prev!, startDate: date || new Date() }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker
                  date={coupon.endDate ? new Date(coupon.endDate) : undefined}
                  setDate={(date) => setCoupon((prev) => ({ ...prev!, endDate: date || new Date() }))}
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
              <div className="flex space-x-2">
                <Button type="submit">Update Coupon</Button>
                <Button type="button" variant="outline" onClick={() => router.push("/coupons")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
