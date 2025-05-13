"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Pencil, Plus, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { type Coupon, type CreateCouponDto, type UpdateCouponDto } from "@/types/coupon"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DiscountType } from "@/types/common"

const CouponSkeleton = () => (
  <TableRow>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[150px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[150px]" />
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[100px]" />
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[100px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[150px]" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
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
    storeId: "", // Added storeId field
  })
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const {
    fetchCouponsByStore,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    products,
    categories,
    collections,
    fetchProductsByStore,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    currentStore,
  } = useMainStore()
  const [currentPage, setCurrentPage] = useState(1)
  const couponsPerPage = 10

  useEffect(() => {
    const loadCoupons = async () => {
      setIsLoading(true)
      try {
        // Use fetchCouponsByStore instead of fetchCoupons
        const fetchedCoupons = await fetchCouponsByStore()
        setCoupons(fetchedCoupons)

        // If we have a currentStore, update the newCoupon state with it
        if (currentStore) {
          setNewCoupon((prev) => ({
            ...prev,
            storeId: currentStore,
          }))
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

    loadCoupons()
    // Use store-specific fetch methods
    fetchProductsByStore()
    fetchCategoriesByStore()
    fetchCollectionsByStore()
  }, [fetchCouponsByStore, toast, fetchProductsByStore, fetchCategoriesByStore, fetchCollectionsByStore, currentStore])

  const handleCreateCoupon = async () => {
    try {
      // Ensure storeId is set
      const couponToCreate = {
        ...newCoupon,
        storeId: currentStore || "",
      }

      await createCoupon(couponToCreate)
      setIsCreateModalOpen(false)
      setNewCoupon({
        code: "",
        description: "",
        type: DiscountType.PERCENTAGE,
        value: 0,
        minPurchase: 0,
        maxUses: 0,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        storeId: currentStore || "",
      })
      // Use fetchCouponsByStore to refresh the list
      const updatedCoupons = await fetchCouponsByStore()
      setCoupons(updatedCoupons)
      toast({
        title: "Success",
        description: "Coupon created successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create coupon. Please try again.",
      })
    }
  }

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return
    try {
      const updatedCoupon: UpdateCouponDto = {
        ...newCoupon,
        value: Number(newCoupon.value),
        minPurchase: Number(newCoupon.minPurchase),
        maxUses: Number(newCoupon.maxUses),
        applicableProductIds: newCoupon.applicableProductIds?.[0] ? [newCoupon.applicableProductIds[0]] : undefined,
        applicableCategoryIds: newCoupon.applicableCategoryIds?.[0] ? [newCoupon.applicableCategoryIds[0]] : undefined,
        applicableCollectionIds: newCoupon.applicableCollectionIds?.[0]
          ? [newCoupon.applicableCollectionIds[0]]
          : undefined,
      }
      await updateCoupon(editingCoupon.id, updatedCoupon)
      setIsEditModalOpen(false)
      setEditingCoupon(null)
      setNewCoupon({
        code: "",
        description: "",
        type: DiscountType.PERCENTAGE,
        value: 0,
        minPurchase: 0,
        maxUses: 0,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
        storeId: currentStore || "",
      })
      // Use fetchCouponsByStore to refresh the list
      const updatedCoupons = await fetchCouponsByStore()
      setCoupons(updatedCoupons)
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update coupon. Please try again.",
      })
    }
  }

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteCoupon(id)
      // Use fetchCouponsByStore to refresh the list
      const updatedCoupons = await fetchCouponsByStore()
      setCoupons(updatedCoupons)
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete coupon. Please try again.",
      })
    }
  }

  const handleDeleteSelectedCoupons = async () => {
    try {
      await Promise.all(selectedCoupons.map((id) => handleDeleteCoupon(id)))
      setSelectedCoupons([])
      toast({
        title: "Success",
        description: "Selected coupons deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete some coupons. Please try again.",
      })
    }
  }

  const filteredCoupons = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(searchLower) || coupon.description?.toLowerCase().includes(searchLower),
    )
  }, [coupons, searchQuery])

  const indexOfLastCoupon = currentPage * couponsPerPage
  const indexOfFirstCoupon = indexOfLastCoupon - couponsPerPage
  const currentCoupons = filteredCoupons.slice(indexOfFirstCoupon, indexOfLastCoupon)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <HeaderBar title="Coupons" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Coupons</h3>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Link href="/coupons/new">
                  <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                    <Plus className="h-4 w-4 mr-2" /> Create
                  </Button>
                </Link>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newCouponCode">Code</Label>
                    <Input
                      id="newCouponCode"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCouponDescription">Description</Label>
                    <Textarea
                      id="newCouponDescription"
                      value={newCoupon.description}
                      onChange={(e) => setNewCoupon((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCouponType">Type</Label>
                    <Select
                      value={newCoupon.type}
                      onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, type: value as DiscountType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                        <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                        <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newCouponValue">Value</Label>
                    <Input
                      id="newCouponValue"
                      type="number"
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCouponMinPurchase">Minimum Purchase</Label>
                    <Input
                      id="newCouponMinPurchase"
                      type="number"
                      value={newCoupon.minPurchase}
                      onChange={(e) => setNewCoupon((prev) => ({ ...prev, minPurchase: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCouponMaxUses">Maximum Uses</Label>
                    <Input
                      id="newCouponMaxUses"
                      type="number"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicableProductIds">Applicable Products</Label>
                    <Select
                      value={newCoupon.applicableProductIds?.[0] || ""}
                      onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableProductIds: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="applicableCategoryIds">Applicable Categories</Label>
                    <Select
                      value={newCoupon.applicableCategoryIds?.[0] || ""}
                      onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableCategoryIds: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="applicableCollectionIds">Applicable Collections</Label>
                    <Select
                      value={newCoupon.applicableCollectionIds?.[0] || ""}
                      onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableCollectionIds: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newCouponStartDate">Start Date</Label>
                    <DatePicker
                      date={new Date(newCoupon.startDate)}
                      setDate={(date) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          startDate: date || prev.startDate,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCouponEndDate">End Date</Label>
                    <DatePicker
                      date={new Date(newCoupon.endDate)}
                      setDate={(date) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          endDate: date || prev.endDate,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newCouponIsActive"
                      checked={newCoupon.isActive}
                      onCheckedChange={(checked) => setNewCoupon((prev) => ({ ...prev, isActive: checked as boolean }))}
                    />
                    <Label htmlFor="newCouponIsActive">Active</Label>
                  </div>
                  <Button onClick={handleCreateCoupon}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[150px]">Code</TableHead>
                  <TableHead className="w-[200px]">Description</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Value</TableHead>
                  <TableHead className="w-[150px]">Valid Until</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, index) => <CouponSkeleton key={index} />)
                  : currentCoupons.map((coupon) => (
                      <TableRow key={coupon.id} className="text-sm">
                        <TableCell className="py-2 pl-6">
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedCoupons.includes(coupon.id)}
                              onCheckedChange={(checked) => {
                                if (typeof checked === "boolean") {
                                  setSelectedCoupons((prev) =>
                                    checked ? [...prev, coupon.id] : prev.filter((id) => id !== coupon.id),
                                  )
                                }
                              }}
                              className="mr-2 shadow-none"
                            />
                            <span className="texto flex-grow truncate">{coupon.code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">{coupon.description}</TableCell>
                        <TableCell className="texto py-2 pl-6">{coupon.type}</TableCell>
                        <TableCell className="texto py-2 pl-6">{coupon.value}</TableCell>
                        <TableCell className="texto py-2 pl-6">
                          {new Date(coupon.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">{coupon.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell className="texto py-2 pl-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shadow-none">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/coupons/${coupon.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${coupon.code}?`)) {
                                    handleDeleteCoupon(coupon.id)
                                  }
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <div className="box-section border-none justify-between items-center ">
            <div className="content-font">
              Showing {indexOfFirstCoupon + 1} to {Math.min(indexOfLastCoupon, filteredCoupons.length)} of{" "}
              {filteredCoupons.length} coupons
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastCoupon >= filteredCoupons.length}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editCouponCode">Code</Label>
                  <Input
                    id="editCouponCode"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCouponDescription">Description</Label>
                  <Textarea
                    id="editCouponDescription"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCouponType">Type</Label>
                  <Select
                    value={newCoupon.type}
                    onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, type: value as DiscountType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                      <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editCouponValue">Value</Label>
                  <Input
                    id="editCouponValue"
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCouponMinPurchase">Minimum Purchase</Label>
                  <Input
                    id="editCouponMinPurchase"
                    type="number"
                    value={newCoupon.minPurchase}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, minPurchase: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCouponMaxUses">Maximum Uses</Label>
                  <Input
                    id="editCouponMaxUses"
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, maxUses: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="applicableProductIds">Applicable Products</Label>
                  <Select
                    value={newCoupon.applicableProductIds?.[0] || ""}
                    onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableProductIds: [value] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="applicableCategoryIds">Applicable Categories</Label>
                  <Select
                    value={newCoupon.applicableCategoryIds?.[0] || ""}
                    onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableCategoryIds: [value] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="applicableCollectionIds">Applicable Collections</Label>
                  <Select
                    value={newCoupon.applicableCollectionIds?.[0] || ""}
                    onValueChange={(value) => setNewCoupon((prev) => ({ ...prev, applicableCollectionIds: [value] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editCouponStartDate">Start Date</Label>
                  <DatePicker
                    date={new Date(newCoupon.startDate)}
                    setDate={(date) =>
                      setNewCoupon((prev) => ({
                        ...prev,
                        startDate: date || prev.startDate,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="editCouponEndDate">End Date</Label>
                  <DatePicker
                    date={new Date(newCoupon.endDate)}
                    setDate={(date) =>
                      setNewCoupon((prev) => ({
                        ...prev,
                        endDate: date || prev.endDate,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editCouponIsActive"
                    checked={newCoupon.isActive}
                    onCheckedChange={(checked) => setNewCoupon((prev) => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="editCouponIsActive">Active</Label>
                </div>
                <Button onClick={handleUpdateCoupon}>Update</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
