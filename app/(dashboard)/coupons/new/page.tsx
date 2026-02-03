"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useCouponMutations } from "@/hooks/useCoupons"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { useCollections } from "@/hooks/useCollections"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { CreateCouponDto } from "@/types/coupon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { HeaderBar } from "@/components/HeaderBar"
import { DiscountType } from "@/types/common"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import { Loader2 } from "lucide-react"

const PRODUCT_SEARCH_DEBOUNCE_MS = 300

export default function NewCouponPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { createCoupon, isCreating } = useCouponMutations(currentStoreId ?? null)

  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearchQuery), PRODUCT_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [productSearchQuery])

  const { data: productsData } = useProducts(currentStoreId ?? null, {
    limit: 20,
    query: debouncedProductSearch.trim() || undefined,
  })
  const { data: categoriesData } = useCategories(currentStoreId ?? null, { limit: 50 })
  const { data: collectionsData } = useCollections(currentStoreId ?? null)

  const products = productsData?.data ?? []
  const categories = categoriesData?.data ?? []
  const collections = collectionsData ?? []

  const [newCoupon, setNewCoupon] = useState<CreateCouponDto>({
    code: "",
    description: "",
    type: DiscountType.PERCENTAGE,
    value: 1,
    startDate: new Date(),
    endDate: new Date(),
    isActive: true,
    storeId: currentStoreId || "",
  })

  const [selectedProductLabels, setSelectedProductLabels] = useState<Record<string, string>>({})
  const productOptions = useMemo(() => {
    const fromQuery = products.map((p) => ({ label: p.title, value: p.id }))
    const selectedIds = newCoupon.applicableProductIds ?? []
    const missing = selectedIds.filter((id) => !fromQuery.some((o) => o.value === id))
    const missingOptions = missing.map((id) => ({
      value: id,
      label: selectedProductLabels[id] ?? id,
    }))
    return [...fromQuery, ...missingOptions]
  }, [products, newCoupon.applicableProductIds, selectedProductLabels])

  useEffect(() => {
    if (currentStoreId) {
      setNewCoupon((prev) => ({ ...prev, storeId: currentStoreId }))
    }
  }, [currentStoreId])

  const handleCreateCoupon = async () => {
    try {
      const couponToCreate: CreateCouponDto = {
        ...newCoupon,
        code: newCoupon.code.toUpperCase(),
        storeId: currentStoreId || newCoupon.storeId,
        value:
          newCoupon.type === DiscountType.FREE_SHIPPING
            ? Math.max(Number(newCoupon.value) || 0, 1)
            : Number(newCoupon.value),
        startDate:
          newCoupon.startDate instanceof Date ? newCoupon.startDate : new Date(newCoupon.startDate),
        endDate: newCoupon.endDate instanceof Date ? newCoupon.endDate : new Date(newCoupon.endDate),
      }

      if (!couponToCreate.applicableProductIds?.length) delete couponToCreate.applicableProductIds
      if (!couponToCreate.applicableCategoryIds?.length) delete couponToCreate.applicableCategoryIds
      if (!couponToCreate.applicableCollectionIds?.length)
        delete couponToCreate.applicableCollectionIds
      if (!newCoupon.minPurchase || newCoupon.minPurchase <= 0) delete couponToCreate.minPurchase
      if (!newCoupon.maxUses || newCoupon.maxUses <= 0) delete couponToCreate.maxUses

      await createCoupon(couponToCreate)
      toast({
        title: "Success",
        description: "Coupon created successfully",
      })
      router.push("/coupons")
    } catch (err) {
      console.error("Failed to create coupon:", err)
      toast({
        variant: "destructive",
        title: "Error al crear cupón",
        description: getApiErrorMessage(err, "No se pudo crear el cupón. Intenta de nuevo."),
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
                  disabled={!!currentStoreId}
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
                  onValueChange={(value) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      type: value as DiscountType,
                      value:
                        value === DiscountType.FREE_SHIPPING
                          ? Math.max(prev.value || 0, 1)
                          : prev.value || 1,
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
                  value={newCoupon.value}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      value:
                        prev.type === DiscountType.FREE_SHIPPING
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
                  value={newCoupon.minPurchase ?? ""}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
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
                  value={newCoupon.maxUses ?? ""}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      maxUses: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Applicable Products</Label>
                <MultiSelect
                  options={productOptions}
                  selected={newCoupon.applicableProductIds}
                  searchValue={productSearchQuery}
                  onSearchChange={setProductSearchQuery}
                  onOpenChange={(open) => !open && setProductSearchQuery("")}
                  onChange={(selected) => {
                    setNewCoupon((prev) => ({ ...prev, applicableProductIds: selected }))
                    setSelectedProductLabels((prev) => {
                      const next = { ...prev }
                      selected.forEach((id) => {
                        const option = productOptions.find((o) => o.value === id)
                        if (option) next[id] = option.label
                      })
                      return next
                    })
                  }}
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
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Create Coupon"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
