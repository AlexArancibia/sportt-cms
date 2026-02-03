"use client"

import { use, useState, useEffect, useMemo } from "react"
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
import { useCouponById, useCouponMutations } from "@/hooks/useCoupons"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { useCollections } from "@/hooks/useCollections"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { UpdateCouponDto, Coupon } from "@/types/coupon"
import type { Product } from "@/types/product"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { DiscountType } from "@/types/common"
import { HeaderBar } from "@/components/HeaderBar"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import { Loader2 } from "lucide-react"

const PRODUCT_SEARCH_DEBOUNCE_MS = 300

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: coupon, isLoading, isError } = useCouponById(
    currentStoreId ?? null,
    resolvedParams.id,
    !!currentStoreId && !!resolvedParams.id
  )
  const { updateCoupon, isUpdating } = useCouponMutations(currentStoreId ?? null)

  const [productSearchQuery, setProductSearchQuery] = useState("")
  const debouncedProductSearch = useDebouncedValue(productSearchQuery, PRODUCT_SEARCH_DEBOUNCE_MS)

  const { data: productsData } = useProducts(currentStoreId ?? null, {
    limit: 20,
    query: debouncedProductSearch.trim() || undefined,
  })
  const { data: categoriesData } = useCategories(currentStoreId ?? null, { limit: 50 })
  const { data: collectionsData } = useCollections(currentStoreId ?? null)

  const products = productsData?.data ?? []
  const categories = categoriesData?.data ?? []
  const collections = collectionsData ?? []

  const [editedCoupon, setEditedCoupon] = useState<Coupon | null>(null)
  const [selectedProductLabels, setSelectedProductLabels] = useState<Record<string, string>>({})
  useEffect(() => {
    if (coupon != null && editedCoupon === null) {
      setEditedCoupon(coupon)
      if (coupon.applicableProducts?.length) {
        setSelectedProductLabels((prev) => {
          const next = { ...prev }
          coupon.applicableProducts!.forEach((p) => {
            next[p.id] = p.title ?? p.id
          })
          return next
        })
      }
    }
  }, [coupon, editedCoupon])
  const couponToEdit = editedCoupon ?? coupon

  const productOptions = useMemo(() => {
    if (!couponToEdit) return []
    const fromQuery = products.map((p) => ({ label: p.title, value: p.id }))
    const selectedIds = couponToEdit.applicableProducts?.map((p) => p.id) ?? []
    const missing = selectedIds.filter((id) => !fromQuery.some((o) => o.value === id))
    const missingOptions = missing.map((id) => ({
      value: id,
      label: selectedProductLabels[id] ?? id,
    }))
    return [...fromQuery, ...missingOptions]
  }, [products, couponToEdit?.applicableProducts, selectedProductLabels])

  const handleUpdateCoupon = async () => {
    const target = editedCoupon ?? coupon
    if (!target) return

    try {
      const payload: UpdateCouponDto & { storeId?: string } = {
        code: target.code,
        description: target.description,
        type: target.type,
        value: target.value,
        minPurchase: target.minPurchase,
        maxUses: target.maxUses,
        startDate: target.startDate,
        endDate: target.endDate,
        isActive: target.isActive,
        applicableProductIds: target.applicableProducts?.map((p) => p.id) || [],
        applicableCategoryIds: target.applicableCategories?.map((c) => c.id) || [],
        applicableCollectionIds: target.applicableCollections?.map((c) => c.id) || [],
      }

      await updateCoupon({
        id: resolvedParams.id,
        data: payload,
        storeId: currentStoreId ?? undefined,
      })
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      })
      router.push("/coupons")
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error al actualizar cupón",
        description: getApiErrorMessage(err, "No se pudo actualizar el cupón. Intenta de nuevo."),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Cargando cupón...</p>
      </div>
    )
  }

  if (isError || !coupon) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-destructive">Coupon not found.</p>
      </div>
    )
  }

  const setCoupon = (updater: Coupon | ((prev: Coupon) => Coupon)) => {
    setEditedCoupon((prev) => {
      const next = typeof updater === "function" ? updater(prev ?? coupon!) : updater
      return next
    })
  }

  if (!couponToEdit) return null

  return (
    <>
      <HeaderBar title="Cupones" />
      <div className="container-section">
        <div className="content-section box-container">
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
                    value={couponToEdit.code}
                    onChange={(e) => setCoupon((prev) => ({ ...prev!, code: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={couponToEdit.description ?? ""}
                    onChange={(e) => setCoupon((prev) => ({ ...prev!, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={couponToEdit.type}
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
                    value={couponToEdit.value}
                    onChange={(e) => setCoupon((prev) => ({ ...prev!, value: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minPurchase">Minimum Purchase</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    value={couponToEdit.minPurchase ?? 0}
                    onChange={(e) => setCoupon((prev) => ({ ...prev!, minPurchase: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={couponToEdit.maxUses ?? 0}
                    onChange={(e) => setCoupon((prev) => ({ ...prev!, maxUses: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Applicable Products</Label>
                  <MultiSelect
                    options={productOptions}
                    selected={couponToEdit.applicableProducts?.map((p) => p.id)}
                    searchValue={productSearchQuery}
                    onSearchChange={setProductSearchQuery}
                    onOpenChange={(open) => !open && setProductSearchQuery("")}
                    onChange={(selected) => {
                      setSelectedProductLabels((prev) => {
                        const next = { ...prev }
                        selected.forEach((id) => {
                          const option = productOptions.find((o) => o.value === id)
                          if (option) next[id] = option.label
                        })
                        return next
                      })
                      setCoupon((prev) => ({
                        ...prev!,
                        applicableProducts: selected.map((id) => {
                          const fromProducts = products.find((p) => p.id === id)
                          if (fromProducts) return fromProducts
                          const option = productOptions.find((o) => o.value === id)
                          return {
                            id,
                            title: option?.label ?? id,
                          } as Product
                        }),
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label>Applicable Categories</Label>
                  <MultiSelect
                    options={categories.map((c) => ({ label: c.name, value: c.id }))}
                    selected={couponToEdit.applicableCategories?.map((c) => c.id)}
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
                    selected={couponToEdit.applicableCollections?.map((c) => c.id)}
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
                    date={couponToEdit.startDate instanceof Date ? couponToEdit.startDate : new Date(couponToEdit.startDate)}
                    setDate={(date) =>
                      setCoupon((prev) => ({
                        ...prev!,
                        startDate: date ?? prev!.startDate,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePicker
                    date={couponToEdit.endDate instanceof Date ? couponToEdit.endDate : new Date(couponToEdit.endDate)}
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
                    checked={couponToEdit.isActive}
                    onCheckedChange={(checked) => setCoupon((prev) => ({ ...prev!, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Update Coupon"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

