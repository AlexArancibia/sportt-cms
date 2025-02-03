"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Edit2, Save } from "lucide-react"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { translateEnum } from "@/lib/translations"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { UpdateOrderDto } from "@/types/order"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const {
    updateOrder,
    orders,
    products,
    fetchProducts,
    currencies,
    fetchCurrencies,
    customers,
    fetchCustomers,
    coupons,
    fetchCoupons,
    paymentProviders,
    fetchPaymentProviders,
    shippingMethods,
    fetchShippingMethods,
    shopSettings,
    fetchShopSettings,
  } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [editMode, setEditMode] = useState({
    status: false,
    shipping: false,
    payment: false,
    notes: false,
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchProducts(),
          fetchCurrencies(),
          fetchCustomers(),
          fetchCoupons(),
          fetchPaymentProviders(),
          fetchShippingMethods(),
          fetchShopSettings(),
        ])

        const foundOrder = orders.find((o) => o.id === resolvedParams.id)
        if (foundOrder) {
          setOrder(foundOrder)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Order not found",
          })
          router.push("/orders")
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error loading necessary data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [
    resolvedParams.id,
    orders,
    fetchProducts,
    fetchCurrencies,
    fetchCustomers,
    fetchCoupons,
    fetchPaymentProviders,
    fetchShippingMethods,
    fetchShopSettings,
    toast,
    router,
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setOrder((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (section: keyof typeof editMode) => {
    setIsLoading(true)
    try {
      if (!order) {
        throw new Error("Order not found")
      }
      const updateData: UpdateOrderDto = {
        customerId: order.customerId,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        currencyId: order.currencyId,
        shippingAddressId: order.shippingAddressId,
        billingAddressId: order.billingAddressId,
        couponId: order.couponId,
        paymentProviderId: order.paymentProviderId,
        shippingMethodId: order.shippingMethodId,
        shippingStatus: order.shippingStatus,
        customerNotes: order.customerNotes,
        internalNotes: order.internalNotes,
        preferredDeliveryDate: order.preferredDeliveryDate,
      }
      await updateOrder(resolvedParams.id, updateData)
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      setEditMode((prev) => ({ ...prev, [section]: false }))
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error updating order. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateOrderTotal = () => {
    if (!order) return 0
    const subtotal = order.lineItems.reduce((total: number, item: any) => {
      return total + item.price * item.quantity
    }, 0)
    const tax = order.totalTax || 0
    const discount = order.totalDiscounts || 0
    const shippingCost = order.shippingMethod?.price || 0
    return subtotal + tax - discount + shippingCost
  }

  if (isLoading || !order) return <div className="flex justify-center items-center h-screen">Loading order...</div>

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3>Order #{order.orderNumber}</h3>
        </div>
      </header>

      <div className="bg-background">
        <div className="grid grid-cols-[65%_35%] gap-6 overflow-x-hidden">
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 border-r border-border p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.lineItems.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 relative">
                                <Image
                                  src={getImageUrl(item.product?.imageUrls[0]) || "/placeholder.svg"}
                                  alt={item.title}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded-md"
                                />
                              </div>
                              <span>{item.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price, order.currency.code)}</TableCell>
                          <TableCell>{formatCurrency(item.price * item.quantity, order.currency.code)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(order.subtotalPrice, order.currency.code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(order.totalTax, order.currency.code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>{formatCurrency(order.totalDiscounts, order.currency.code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.shippingMethod?.price || 0, order.currency.code)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateOrderTotal(), order.currency.code)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Order Status</CardTitle>
                  {!editMode.status ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode((prev) => ({ ...prev, status: true }))}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleSubmit("status")}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="financialStatus">Financial Status</Label>
                      {editMode.status ? (
                        <Select
                          value={order.financialStatus}
                          onValueChange={(value) => setOrder((prev: any) => ({ ...prev, financialStatus: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select financial status" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(OrderFinancialStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {translateEnum(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{translateEnum(order.financialStatus)}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
                      {editMode.status ? (
                        <Select
                          value={order.fulfillmentStatus}
                          onValueChange={(value) => setOrder((prev: any) => ({ ...prev, fulfillmentStatus: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fulfillment status" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(OrderFulfillmentStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {translateEnum(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{translateEnum(order.fulfillmentStatus)}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Shipping Information</CardTitle>
                  {!editMode.shipping ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode((prev) => ({ ...prev, shipping: true }))}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleSubmit("shipping")}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shippingStatus">Shipping Status</Label>
                      {editMode.shipping ? (
                        <Select
                          value={order.shippingStatus}
                          onValueChange={(value) => setOrder((prev: any) => ({ ...prev, shippingStatus: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select shipping status" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ShippingStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {translateEnum(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{translateEnum(order.shippingStatus)}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shippingMethodId">Shipping Method</Label>
                      {editMode.shipping ? (
                        <Select
                          value={order.shippingMethodId}
                          onValueChange={(value) => setOrder((prev: any) => ({ ...prev, shippingMethodId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select shipping method" />
                          </SelectTrigger>
                          <SelectContent>
                            {shippingMethods.map((method: any) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{order.shippingMethod?.name || "Not specified"}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="preferredDeliveryDate">Preferred Delivery Date</Label>
                      {editMode.shipping ? (
                        <DatePicker
                          date={order.preferredDeliveryDate ? new Date(order.preferredDeliveryDate) : undefined}
                          setDate={(date) =>
                            setOrder((prev: any) => ({ ...prev, preferredDeliveryDate: date?.toISOString() }))
                          }
                        />
                      ) : (
                        <div className="mt-1">
                          {order.preferredDeliveryDate
                            ? new Date(order.preferredDeliveryDate).toLocaleDateString()
                            : "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment Information</CardTitle>
                  {!editMode.payment ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode((prev) => ({ ...prev, payment: true }))}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleSubmit("payment")}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paymentProviderId">Payment Provider</Label>
                      {editMode.payment ? (
                        <Select
                          value={order.paymentProviderId}
                          onValueChange={(value) => setOrder((prev: any) => ({ ...prev, paymentProviderId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentProviders.map((provider: any) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{order.paymentProvider?.name || "Not specified"}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Notes</CardTitle>
                  {!editMode.notes ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode((prev) => ({ ...prev, notes: true }))}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleSubmit("notes")}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerNotes">Customer Notes</Label>
                      {editMode.notes ? (
                        <Textarea
                          id="customerNotes"
                          name="customerNotes"
                          value={order.customerNotes}
                          onChange={handleChange}
                          rows={4}
                        />
                      ) : (
                        <div className="mt-1">{order.customerNotes || "No customer notes"}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="internalNotes">Internal Notes</Label>
                      {editMode.notes ? (
                        <Textarea
                          id="internalNotes"
                          name="internalNotes"
                          value={order.internalNotes}
                          onChange={handleChange}
                          rows={4}
                        />
                      ) : (
                        <div className="mt-1">{order.internalNotes || "No internal notes"}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order Number:</span>
                      <span>#{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date Created:</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(calculateOrderTotal(), order.currency.code)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      {order.fulfillmentStatus && (
                        <Badge
                          variant={
                            (order.fulfillmentStatus.toLowerCase() as
                              | "unfulfilled"
                              | "partially_fulfilled"
                              | "fulfilled"
                              | "restocked"
                              | "pending_fulfillment"
                              | "open"
                              | "in_progress"
                              | "on_hold"
                              | "scheduled"
                              | "default") || "default"
                          }
                        >
                          {translateEnum(order.fulfillmentStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Name:</span> {order.customer?.firstName}{" "}
                      {order.customer?.lastName}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="not-italic">
                    {order.shippingAddress?.address1}
                    <br />
                    {order.shippingAddress?.address2 && (
                      <>
                        {order.shippingAddress.address2}
                        <br />
                      </>
                    )}
                    {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.zip}
                    <br />
                    {order.shippingAddress?.country}
                  </address>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

