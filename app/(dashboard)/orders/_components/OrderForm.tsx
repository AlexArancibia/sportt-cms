"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, ArrowLeft, ArrowRight, PackageIcon, TrendingUpIcon, UserIcon, CreditCardIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
 
import type {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
 
} from "@/types/order"
import type { Currency } from "@/types/currency"
import type { Address } from "@/types/address"
import type { Customer } from "@/types/customer"
import type { Coupon } from "@/types/coupon"
import type { PaymentProvider } from "@/types/payments"
import type { ShippingMethod } from "@/types/shippingMethod"
import type { Product } from "@/types/product"
import type { ProductVariant } from "@/types/productVariant"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import { ProductSelectionDialog } from "./ProductSelectionDialog"
import { CreateUserDialog } from "./CreateUserDialog"
import { CreateAddressDialog } from "./CreateAddressDialog"

interface OrderFormProps {
  orderId?: string
}

export function OrderForm({ orderId }: OrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    createOrder,
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

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)

  const [formData, setFormData] = useState<CreateOrderDto & Partial<UpdateOrderDto>>({
    customerId: "",
    email: "",
    phone: "",
    currencyId: "",
    totalPrice: 0,
    subtotalPrice: 0,
    totalTax: 0,
    totalDiscounts: 0,
    lineItems: [],
    shippingAddressId: "",
    billingAddressId: "",
    couponId: "",
    paymentProviderId: "",
    shippingMethodId: "",
    financialStatus: OrderFinancialStatus.PENDING,
    fulfillmentStatus: OrderFulfillmentStatus.UNFULFILLED,
    shippingStatus: ShippingStatus.PENDING,
    customerNotes: "",
    internalNotes: "",
    source: "admin",
    preferredDeliveryDate: new Date().toISOString(),
  })

  useEffect(() => {
    const loadData = async () => {
      console.log("Starting to load data...")
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
        console.log("All data fetched successfully")

        if (orderId) {
          console.log(`Fetching order details for orderId: ${orderId}`)
          const order = orders.find((o) => o.id === orderId)
          if (order) {
            console.log("Order found, setting form data")
            setFormData(order)
          } else {
            console.log("Order not found")
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load necessary data. Please try again.",
        })
      } finally {
        setIsLoading(false)
        console.log("Finished loading data")
      }
    }

    loadData()
  }, [
    orderId,
    orders,
    fetchProducts,
    fetchCurrencies,
    fetchCustomers,
    fetchCoupons,
    fetchPaymentProviders,
    fetchShippingMethods,
    fetchShopSettings,
    toast,
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log(`Handling change for ${name}: ${value}`)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitting form data:", formData)
    setIsLoading(true)
    try {
      if (orderId) {
        console.log(`Updating order: ${orderId}`)
        const updateData: UpdateOrderDto = {
          customerId: formData.customerId,
          email: formData.email,
          phone: formData.phone,
          financialStatus: formData.financialStatus,
          fulfillmentStatus: formData.fulfillmentStatus,
          currencyId: formData.currencyId,
          shippingAddressId: formData.shippingAddressId,
          billingAddressId: formData.billingAddressId,
          couponId: formData.couponId,
          paymentProviderId: formData.paymentProviderId,
          shippingMethodId: formData.shippingMethodId,
          shippingStatus: formData.shippingStatus,
          customerNotes: formData.customerNotes,
          internalNotes: formData.internalNotes,
          preferredDeliveryDate: formData.preferredDeliveryDate,
        }
        await updateOrder(orderId, updateData)
      } else {
        console.log("Creating new order")
        await createOrder(formData)
      }
      toast({
        title: "Success",
        description: `Order ${orderId ? "updated" : "created"} successfully`,
      })
      router.push("/orders")
    } catch (error) {
      console.error(`Failed to ${orderId ? "update" : "create"} order:`, error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${orderId ? "update" : "create"} order. Please try again.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelection = (selections: Array<{ productId: string; variantId: string; quantity: number }>) => {
    console.log("Selected products:", selections)
    setFormData((prev) => ({
      ...prev,
      lineItems: selections.map((selection) => ({
        ...selection,
        title: "", // This should be filled with the actual product title
        price: 0, // This should be filled with the actual product price
        totalDiscount: 0,
      })),
    }))
  }

  const handleUserCreated = (userId: string) => {
    console.log(`New user created with ID: ${userId}`)
    setFormData((prev) => ({ ...prev, customerId: userId }))
    fetchCustomers()
  }

  const handleAddressCreated = (address: Address) => {
    console.log("New address created:", address)
    setFormData((prev) => ({
      ...prev,
      shippingAddressId: address.id,
      billingAddressId: address.id,
    }))
  }

  const calculateTotals = () => {
    console.log("Calculating order totals")
    const subtotal = formData.lineItems.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)

    const tax = subtotal * 0// Assuming 10% tax rate
    const discount = formData.totalDiscounts || 0
    const total = subtotal + tax - discount

    console.log(`Subtotal: ${subtotal}, Tax: ${tax}, Discount: ${discount}, Total: ${total}`)
    return { subtotal, tax, discount, total }
  }

  const { subtotal, tax, discount, total } = calculateTotals()

  const renderCustomerInfo = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Customer Information</h3>
        <span className="content-font text-gray-500">Enter the customer details for this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-1/2 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="customerId" className="content-font">
              Customer
            </Label>
            <div className="flex items-center space-x-2">
              <Select
                value={formData.customerId}
                onValueChange={(value) => {
                  console.log(`Selected customer: ${value}`)
                  setFormData((prev) => ({ ...prev, customerId: value }))
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => setIsUserDialogOpen(true)}>
                <UserIcon className="w-4 h-4 mr-2" />
                New Customer
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="content-font">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="content-font">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrderDetails = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Order Details</h3>
        <span className="content-font text-gray-500">Manage the products and details for this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-full flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="currencyId" className="content-font">
              Currency
            </Label>
            <Select
              value={formData.currencyId}
              onValueChange={(value) => {
                console.log(`Selected currency: ${value}`)
                setFormData((prev) => ({ ...prev, currencyId: value }))
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Button type="button" onClick={() => setIsProductDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Products
            </Button>
          </div>
          {formData.lineItems && formData.lineItems.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId)
                  const variant = product?.variants.find((v) => v.id === item.variantId)

                  // Use item.price if available, otherwise try to find the price from the variant
                  const price =
                    item.price || variant?.prices.find((p) => p.currency.id === formData.currencyId)?.price || 0
                  const total = price * item.quantity
                  console.log("GAAAA")
                  console.log(formData.currencyId)
                  console.log(
                    `Item ${index}: Product: ${product?.title}, Variant: ${variant?.title}, Price: ${price}, Total: ${total}`,
                  )
                  console.log(variant)

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {product?.imageUrls && product.imageUrls.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Image
                              src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                              alt={product?.title || "Product image"}
                              width={50}
                              height={50}
                              className="object-cover rounded"
                            />
                            <span>{product?.title}</span>
                          </div>
                        ) : (
                          <span>{product?.title}</span>
                        )}
                      </TableCell>
                      <TableCell>{variant?.title}</TableCell>
                      <TableCell className="text-right">{price }</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">{total }</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end">
            <div className="w-[200px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderShippingAndBilling = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Shipping & Billing</h3>
        <span className="content-font text-gray-500">Manage shipping and billing information for this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-1/2 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="shippingAddressId" className="content-font">
              Shipping Address
            </Label>
            <div className="flex items-center space-x-2">
              <Select
                value={formData.shippingAddressId}
                onValueChange={(value) => {
                  console.log(`Selected shipping address: ${value}`)
                  setFormData((prev) => ({ ...prev, shippingAddressId: value }))
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select shipping address" />
                </SelectTrigger>
                <SelectContent>
                  {customers
                    .find((c) => c.id === formData.customerId)
                    ?.addresses?.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {address.address1}, {address.city}, {address.country}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => setIsAddressDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Address
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingAddressId" className="content-font">
              Billing Address
            </Label>
            <Select
              value={formData.billingAddressId}
              onValueChange={(value) => {
                console.log(`Selected billing address: ${value}`)
                setFormData((prev) => ({ ...prev, billingAddressId: value }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select billing address" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .find((c) => c.id === formData.customerId)
                  ?.addresses?.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      {address.address1}, {address.city}, {address.country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingMethodId" className="content-font">
              Shipping Method
            </Label>
            <Select
              value={formData.shippingMethodId}
              onValueChange={(value) => {
                console.log(`Selected shipping method: ${value}`)
                setFormData((prev) => ({ ...prev, shippingMethodId: value }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select shipping method" />
              </SelectTrigger>
              <SelectContent>
                {shippingMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPaymentAndDiscounts = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Payment & Discounts</h3>
        <span className="content-font text-gray-500">Manage payment and discount information for this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-1/2 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="paymentProviderId" className="content-font">
              Payment Provider
            </Label>
            <Select
              value={formData.paymentProviderId}
              onValueChange={(value) => {
                console.log(`Selected payment provider: ${value}`)
                setFormData((prev) => ({ ...prev, paymentProviderId: value }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select payment provider" />
              </SelectTrigger>
              <SelectContent>
                {paymentProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="couponId" className="content-font">
              Coupon
            </Label>
            <Select
              value={formData.couponId}
              onValueChange={(value) => {
                console.log(`Selected coupon: ${value}`)
                setFormData((prev) => ({ ...prev, couponId: value }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select coupon" />
              </SelectTrigger>
              <SelectContent>
                {coupons.map((coupon) => (
                  <SelectItem key={coupon.id} value={coupon.id}>
                    {coupon.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrderStatus = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Order Status</h3>
        <span className="content-font text-gray-500">Manage the status of this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-1/2 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="financialStatus" className="content-font">
              Financial Status
            </Label>
            <Select
              value={formData.financialStatus}
              onValueChange={(value) => {
                console.log(`Selected financial status: ${value}`)
                setFormData((prev) => ({ ...prev, financialStatus: value as OrderFinancialStatus }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select financial status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderFinancialStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fulfillmentStatus" className="content-font">
              Fulfillment Status
            </Label>
            <Select
              value={formData.fulfillmentStatus}
              onValueChange={(value) => {
                console.log(`Selected fulfillment status: ${value}`)
                setFormData((prev) => ({ ...prev, fulfillmentStatus: value as OrderFulfillmentStatus }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select fulfillment status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrderFulfillmentStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingStatus" className="content-font">
              Shipping Status
            </Label>
            <Select
              value={formData.shippingStatus}
              onValueChange={(value) => {
                console.log(`Selected shipping status: ${value}`)
                setFormData((prev) => ({ ...prev, shippingStatus: value as ShippingStatus }))
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select shipping status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ShippingStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAdditionalInfo = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start">
        <h3 className="">Additional Information</h3>
        <span className="content-font text-gray-500">Add any additional notes or information for this order.</span>
      </div>
      <div className="box-section border-none flex-row gap-12 pb-6 items-start">
        <div className="w-1/2 flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="customerNotes" className="content-font">
              Customer Notes
            </Label>
            <Input
              id="customerNotes"
              name="customerNotes"
              value={formData.customerNotes}
              onChange={handleChange}
              className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes" className="content-font">
              Internal Notes
            </Label>
            <Input
              id="internalNotes"
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredDeliveryDate" className="content-font">
              Preferred Delivery Date
            </Label>
            <DatePicker
              date={formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate) : undefined}
              setDate={(date) => {
                console.log(`Selected preferred delivery date: ${date}`)
                setFormData((prev) => ({ ...prev, preferredDeliveryDate: date?.toISOString() }))
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 1 && "text-foreground border-b-[3px] pt-[10px] border-sky-600",
            )}
            onClick={() => setCurrentStep(1)}
          >
            <UserIcon className="text-foreground mr-2" />
            Customer
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 2 && "text-foreground border-b-[3px] pt-[10px] border-sky-600",
            )}
            onClick={() => setCurrentStep(2)}
          >
            <PackageIcon className="text-foreground mr-2" />
            Order Details
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 3 && "text-foreground border-b-[3px] pt-[10px] border-sky-600",
            )}
            onClick={() => setCurrentStep(3)}
          >
            <TrendingUpIcon className="text-foreground mr-2" />
            Status
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : orderId ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </header>
      <div className="p-6">
        <ScrollArea className="h-[calc(100vh-9em)]">
          {currentStep === 1 && (
            <>
              {renderCustomerInfo()}
              {renderShippingAndBilling()}
            </>
          )}
          {currentStep === 2 && (
            <>
              {renderOrderDetails()}
              {renderPaymentAndDiscounts()}
            </>
          )}
          {currentStep === 3 && (
            <>
              {renderOrderStatus()}
              {renderAdditionalInfo()}
            </>
          )}
        </ScrollArea>
      </div>

      <ProductSelectionDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        products={products}
        selectedCurrency={formData.currencyId}
        onConfirm={handleProductSelection}
      />

      <CreateUserDialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} onUserCreated={handleUserCreated} />
      {formData.customerId &&
      <CreateAddressDialog
        open={isAddressDialogOpen}
        onOpenChange={setIsAddressDialogOpen}
        customerId={formData.customerId}
        onAddressCreated={handleAddressCreated}
      />
    }
    </div>
  )
}

