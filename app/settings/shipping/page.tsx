"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Pencil, Plus, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto, CreateShippingMethodPriceDto } from "@/types/shippingMethod"
 import type { Currency } from "@/types/currency"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const ShippingMethodSkeleton = () => (
  <TableRow>
    <TableCell className="w-[30%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[200px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[30%] py-2 px-2">
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

export default function ShippingMethodsPage() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingShippingMethod, setEditingShippingMethod] = useState<ShippingMethod | null>(null)
  const [newShippingMethod, setNewShippingMethod] = useState<CreateShippingMethodDto>({
    name: "",
    description: "",
    prices: [],
    estimatedDeliveryTime: "",
    isActive: true,
  })
  const [selectedShippingMethods, setSelectedShippingMethods] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { fetchShippingMethods, fetchCurrencies, createShippingMethod, updateShippingMethod, deleteShippingMethod } =
    useMainStore()
  const [currentPage, setCurrentPage] = useState(1)
  const shippingMethodsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [fetchedShippingMethods, fetchedCurrencies] = await Promise.all([
          fetchShippingMethods(),
          fetchCurrencies(),
        ])
        setShippingMethods(fetchedShippingMethods)
        setCurrencies(fetchedCurrencies)
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
  }, [fetchShippingMethods, fetchCurrencies, toast])

  const handleCreateShippingMethod = async () => {
    try {
      await createShippingMethod(newShippingMethod)
      setIsCreateModalOpen(false)
      setNewShippingMethod({
        name: "",
        description: "",
        prices: [],
        estimatedDeliveryTime: "",
        isActive: true,
      })
      const updatedShippingMethods = await fetchShippingMethods()
      setShippingMethods(updatedShippingMethods)
      toast({
        title: "Success",
        description: "Shipping method created successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create shipping method. Please try again.",
      })
    }
  }

  const handleUpdateShippingMethod = async () => {
    if (!editingShippingMethod) return
    try {
      const updatedShippingMethod: UpdateShippingMethodDto = {
        name: newShippingMethod.name,
        description: newShippingMethod.description,
        prices: newShippingMethod.prices,
        estimatedDeliveryTime: newShippingMethod.estimatedDeliveryTime,
        isActive: newShippingMethod.isActive,
      }
      await updateShippingMethod(editingShippingMethod.id, updatedShippingMethod)
      setIsEditModalOpen(false)
      setEditingShippingMethod(null)
      setNewShippingMethod({
        name: "",
        description: "",
        prices: [],
        estimatedDeliveryTime: "",
        isActive: true,
      })
      const updatedShippingMethods = await fetchShippingMethods()
      setShippingMethods(updatedShippingMethods)
      toast({
        title: "Success",
        description: "Shipping method updated successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update shipping method. Please try again.",
      })
    }
  }

  const handleDeleteShippingMethod = async (id: string) => {
    try {
      await deleteShippingMethod(id)
      const updatedShippingMethods = await fetchShippingMethods()
      setShippingMethods(updatedShippingMethods)
      toast({
        title: "Success",
        description: "Shipping method deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete shipping method. Please try again.",
      })
    }
  }

  const handleDeleteSelectedShippingMethods = async () => {
    try {
      await Promise.all(selectedShippingMethods.map((id) => handleDeleteShippingMethod(id)))
      setSelectedShippingMethods([])
      toast({
        title: "Success",
        description: "Selected shipping methods deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete some shipping methods. Please try again.",
      })
    }
  }

  const filteredShippingMethods = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return shippingMethods.filter(
      (method) =>
        method.name.toLowerCase().includes(searchLower) || method.description?.toLowerCase().includes(searchLower),
    )
  }, [shippingMethods, searchQuery])

  const indexOfLastShippingMethod = currentPage * shippingMethodsPerPage
  const indexOfFirstShippingMethod = indexOfLastShippingMethod - shippingMethodsPerPage
  const currentShippingMethods = filteredShippingMethods.slice(indexOfFirstShippingMethod, indexOfLastShippingMethod)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleAddPrice = () => {
    setNewShippingMethod((prev) => ({
      ...prev,
      prices: [...prev.prices, { currencyId: "", price: 0 }],
    }))
  }

  const handleRemovePrice = (index: number) => {
    setNewShippingMethod((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index),
    }))
  }

  const handlePriceChange = (index: number, field: keyof CreateShippingMethodPriceDto, value: string | number) => {
    setNewShippingMethod((prev) => ({
      ...prev,
      prices: prev.prices.map((price, i) => (i === index ? { ...price, [field]: value } : price)),
    }))
  }

  return (
    <>
      <HeaderBar title="Shipping Methods" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Shipping Methods</h3>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shipping Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newShippingMethodName">Name</Label>
                    <Input
                      id="newShippingMethodName"
                      value={newShippingMethod.name}
                      onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newShippingMethodDescription">Description</Label>
                    <Textarea
                      id="newShippingMethodDescription"
                      value={newShippingMethod.description}
                      onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Prices</Label>
                    {newShippingMethod.prices.map((price, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={price.currencyId}
                          onValueChange={(value) => handlePriceChange(index, "currencyId", value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={price.price}
                          onChange={(e) => handlePriceChange(index, "price", Number.parseFloat(e.target.value))}
                          placeholder="Price"
                        />
                        <Button onClick={() => handleRemovePrice(index)} variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button onClick={handleAddPrice} variant="outline" className="mt-2">
                      Add Price
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="newShippingMethodEstimatedDeliveryTime">Estimated Delivery Time</Label>
                    <Input
                      id="newShippingMethodEstimatedDeliveryTime"
                      value={newShippingMethod.estimatedDeliveryTime}
                      onChange={(e) =>
                        setNewShippingMethod((prev) => ({ ...prev, estimatedDeliveryTime: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newShippingMethodIsActive"
                      checked={newShippingMethod.isActive}
                      onCheckedChange={(checked) =>
                        setNewShippingMethod((prev) => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <Label htmlFor="newShippingMethodIsActive">Active</Label>
                  </div>
                  <Button onClick={handleCreateShippingMethod}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search shipping methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[250px]">Name</TableHead>
                  <TableHead className="w-[200px]">Prices</TableHead>
                  <TableHead className="w-[200px]">Estimated Delivery Time</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, index) => <ShippingMethodSkeleton key={index} />)
                  : currentShippingMethods.map((method) => (
                      <TableRow key={method.id} className="text-sm">
                        <TableCell className="py-2 pl-6">
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedShippingMethods.includes(method.id)}
                              onCheckedChange={(checked) => {
                                if (typeof checked === "boolean") {
                                  setSelectedShippingMethods((prev) =>
                                    checked ? [...prev, method.id] : prev.filter((id) => id !== method.id),
                                  )
                                }
                              }}
                              className="mr-2 shadow-none"
                            />
                            <span className="texto flex-grow truncate">{method.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">
                          {method.prices.map((price, index) => (
                            <div key={index}>
                              {price.currency.code}: {price.price}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">{method.estimatedDeliveryTime}</TableCell>
                        <TableCell className="texto py-2 pl-6">{method.isActive ? "Yes" : "No"}</TableCell>
                        <TableCell className="texto py-2 pl-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shadow-none">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingShippingMethod(method)
                                  setIsEditModalOpen(true)
                                  setNewShippingMethod({
                                    name: method.name,
                                    description: method.description || "",
                                    prices: method.prices.map((price) => ({
                                      currencyId: price.currency.id,
                                      price: price.price,
                                    })),
                                    estimatedDeliveryTime: method.estimatedDeliveryTime || "",
                                    isActive: method.isActive,
                                  })
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${method.name}?`)) {
                                    handleDeleteShippingMethod(method.id)
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
              Showing {indexOfFirstShippingMethod + 1} to{" "}
              {Math.min(indexOfLastShippingMethod, filteredShippingMethods.length)} of {filteredShippingMethods.length}{" "}
              shipping methods
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastShippingMethod >= filteredShippingMethods.length}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Shipping Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editShippingMethodName">Name</Label>
                  <Input
                    id="editShippingMethodName"
                    value={newShippingMethod.name}
                    onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editShippingMethodDescription">Description</Label>
                  <Textarea
                    id="editShippingMethodDescription"
                    value={newShippingMethod.description}
                    onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Prices</Label>
                  {newShippingMethod.prices.map((price, index) => (
                    <div key={index} className="flex items-center space-x-2 mt-2">
                      <Select
                        value={price.currencyId}
                        onValueChange={(value) => handlePriceChange(index, "currencyId", value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={price.price}
                        onChange={(e) => handlePriceChange(index, "price", Number.parseFloat(e.target.value))}
                        placeholder="Price"
                      />
                      <Button onClick={() => handleRemovePrice(index)} variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={handleAddPrice} variant="outline" className="mt-2">
                    Add Price
                  </Button>
                </div>
                <div>
                  <Label htmlFor="editShippingMethodEstimatedDeliveryTime">Estimated Delivery Time</Label>
                  <Input
                    id="editShippingMethodEstimatedDeliveryTime"
                    value={newShippingMethod.estimatedDeliveryTime}
                    onChange={(e) =>
                      setNewShippingMethod((prev) => ({ ...prev, estimatedDeliveryTime: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editShippingMethodIsActive"
                    checked={newShippingMethod.isActive}
                    onCheckedChange={(checked) =>
                      setNewShippingMethod((prev) => ({ ...prev, isActive: checked as boolean }))
                    }
                  />
                  <Label htmlFor="editShippingMethodIsActive">Active</Label>
                </div>
                <Button onClick={handleUpdateShippingMethod}>Update</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}

