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
import { Plus, UserIcon, CircleDollarSign, Trash2, Settings } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"

import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import type { Address } from "@/types/address"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import { CreateAddressDialog } from "./CreateAddressDialog"
import { CreateUserDialog } from "./CreateUserDialog"
import { ProductSelectionDialog } from "./ProductSelectionDialog"
import { ProductVariant } from "@/types/productVariant"
import { translateEnum } from "@/lib/translations"
 

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

  const [isLoading, setIsLoading] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)

  const [formData, setFormData] = useState<CreateOrderDto & Partial<UpdateOrderDto>>({
    customerId: "",
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
    source: "web",
    preferredDeliveryDate: new Date().toISOString(),
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

        if (orderId) {
          const order = orders.find((o) => o.id === orderId)
          if (order) setFormData(order)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load necessary data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [
    orderId,
    orders,
    shopSettings,
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (orderId) {
        const updateData: UpdateOrderDto = {
          customerId: formData.customerId,
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
        await createOrder(formData)
      }
      toast({
        title: "Success",
        description: `Order ${orderId ? "updated" : "created"} successfully`,
      })
      router.push("/orders")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${orderId ? "update" : "create"} order. Please try again.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      const variant = product?.variants.find((v) => v.id === item.variantId)
      const price = Number(item.price || getVariantPrice(variant, formData.currencyId) || 0)
      return total + price * item.quantity
    }, 0)

    const taxRate = shopSettings[0]?.taxValue ? shopSettings[0]?.taxValue / 100 : 0
    let tax = 0
    let total = subtotal

    if (shopSettings[0]?.taxesIncluded) {
      tax = (subtotal / (1 + taxRate)) * taxRate
    } else {
      tax = subtotal * taxRate
      total += tax

    }

    const discount = formData.totalDiscounts || 0
    total -= discount

    const shipmentMethod = shippingMethods.find((s) => s.id === formData.shippingMethodId)
    const shipmentCost = Number(shipmentMethod?.prices.find((p) => p.currencyId === formData.currencyId)?.price ?? 0)
    total += shipmentCost

    return { subtotal, tax, discount, total, shipmentCost }
  }

  const updateFormDataTotals = () => {
    const { subtotal, tax, discount, total } = calculateTotals()
    setFormData((prev) => ({
      ...prev,
      totalPrice: total,
      subtotalPrice: subtotal,
      totalTax: tax,
      totalDiscounts: discount,
    }))
  }

  useEffect(() => {
    updateFormDataTotals()
  }, [
    formData.lineItems,
    formData.shippingMethodId,
    formData.currencyId,
    formData.couponId,
    products,
    shippingMethods,
    formData.totalDiscounts,
  ])

  const getVariantPrice = (variant: ProductVariant | undefined, currencyId: string): number | undefined => {
    if (!variant) return undefined
    const price = variant.prices.find((p: { currencyId: string }) => p.currencyId === currencyId)
    return price ? price.price : undefined
  }

  const handleProductSelection = (selections: Array<{ productId: string; variantId: string | null }>) => {
    const newLineItems = selections.map((selection) => {
      const product = products.find((p) => p.id === selection.productId)
      const variant = selection.variantId ? product?.variants.find((v) => v.id === selection.variantId) : null

      return {
        productId: selection.productId,
        variantId: selection.variantId || undefined,
        title: variant ? variant.title : product?.title || "",
        price: getVariantPrice(variant || undefined, formData.currencyId) || 0,
        quantity: 1,
        totalDiscount: 0,
      }
    })

    setFormData((prev) => ({
      ...prev,
      lineItems: newLineItems,
    }))

    updateFormDataTotals()
  }

  const handleDeleteItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
    updateFormDataTotals()
  }

  const handleUserCreated = (userId: string) => {
    setFormData((prev) => ({ ...prev, customerId: userId }))
    fetchCustomers()
  }

  const handleAddressCreated = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddressId: address.id,
      billingAddressId: address.id,
    }))
  }

  const renderCustomerInfo = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerId">Cliente</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.customerId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, customerId: value }))}
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
    </div>
  )

  const renderOrderDetails = () => {
    const { subtotal, tax, discount, total, shipmentCost } = calculateTotals()
    return (
      <div className="space-y-3">
        <div className="space-y-1 flex justify-between items-center container-section pb-0">
          <h4>Detalles del Pedido</h4>
          <div className="flex gap-2">
            <Select
              value={formData.currencyId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, currencyId: value }))}
            >
              <SelectTrigger className="w-[70px] h-8 bg-background font-medium">
                <SelectValue
                  placeholder={
                    <div className="flex items-center justify-center">
                      <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="shadow-none h-8 px-2 text-sm"
              onClick={() => setIsProductDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Añadir Productos
            </Button>
          </div>
        </div>
        {formData.lineItems && formData.lineItems.length > 0 ? (
          <>
            <Table className="border-y">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Producto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right w-[100px]">Cantidad</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                  <TableHead className="text-right">
                    <Settings size={16} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId)
                  const variant = product?.variants.find((v) => v.id === item.variantId)
                  const price = item.price || getVariantPrice(variant, formData.currencyId) || 0
                  const total = price * item.quantity

                  return (
                    <TableRow key={index}>
                      <TableCell className="pl-6 ">
                        {product?.imageUrls && product.imageUrls.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Image
                              src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                              alt={product?.title || "Product image"}
                              width={30}
                              height={30}
                              className="object-cover rounded"
                            />
                            <span>{product?.title}</span>
                          </div>
                        ) : (
                          <span>{product?.title}</span>
                        )}
                      </TableCell>
                      <TableCell>{variant?.title}</TableCell>
                      <TableCell className="text-right">{price}</TableCell>
                      <TableCell className="w-[100px]  flex justify-end items-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = Number.parseInt(e.target.value, 10)
                            if (!isNaN(newQuantity) && newQuantity >= 1) {
                              const updatedLineItems = [...formData.lineItems]
                              updatedLineItems[index].quantity = newQuantity
                              setFormData((prev) => ({
                                ...prev,
                                lineItems: updatedLineItems,
                              }))
                            }
                          }}
                          className="text-right h-7 max-w-[60px]"
                        />
                      </TableCell>
                      <TableCell className="text-right pr-6">{total.toFixed(2)}</TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className=" text-red-600 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="  space-y-1 text-sm px-6">
              <div className="flex justify-between">
                <Select
                  value={formData.couponId}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, couponId: value }))
                    updateFormDataTotals()
                  }}
                >
                  <SelectTrigger className="w-[230px] focus:ring-0 text-sky-600 h-6 p-0 bg-transparent border-none">
                    <SelectValue className="font-extralight" placeholder="Agregar cupón de descuento" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>{formData.totalDiscounts.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-primary/80">Subtotal</span>
                <span className="font-light">{(formData.subtotalPrice-formData.totalTax).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-primary/80">
                <Select
                  value={formData.shippingMethodId}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, shippingMethodId: value }))
                    updateFormDataTotals()
                  }}
                >
                  <SelectTrigger className="w-[230px] focus:ring-0 text-sky-600 h-6 p-0 bg-transparent border-none">
                    <SelectValue className=" " placeholder="Agregar metodo de envio" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>{shipmentCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/80">Impuesto </span>
                <span>{formData.totalTax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span className="text-primary/90">Total</span>
                <span>{formData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-12 flex justify-center items-center text-xs text-foreground">
            Sin productos encontrados.
          </div>
        )}
      </div>
    )
  }

  const renderShippingAndBilling = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shippingAddressId">Shipping Address</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.shippingAddressId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingAddressId: value }))}
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
        <Label htmlFor="billingAddressId">Billing Address</Label>
        <Select
          value={formData.billingAddressId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, billingAddressId: value }))}
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
      <div className="space-y-2"></div>
    </div>
  )

  const renderPaymentAndDiscounts = () => (
    <div className="space-y-6 px-6  ">
      <div className="space-y-2 flex flex-col">
        <Label htmlFor="preferredDeliveryDate" className="mb-1">
          Fecha de envío preferida
        </Label>
        <DatePicker
          date={formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate) : undefined}
          setDate={(date) => setFormData((prev) => ({ ...prev, preferredDeliveryDate: date?.toISOString() }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentProviderId" className="">
          Metodo de Pago
        </Label>
        <Select
          value={formData.paymentProviderId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentProviderId: value }))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Seleccione metodo de pago" />
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
      <div className="space-y-2"></div>
    </div>
  )

  const renderOrderStatus = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="financialStatus">Financial Status</Label>
        <Select
          value={formData.financialStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, financialStatus: value as OrderFinancialStatus }))
          }
        >
          <SelectTrigger className="w-[300px]">
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
        <Select
          value={formData.fulfillmentStatus}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, fulfillmentStatus: value as OrderFulfillmentStatus }))
          }
        >
          <SelectTrigger className="w-[300px]">
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="shippingStatus">Shipping Status</Label>
        <Select
          value={formData.shippingStatus}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingStatus: value as ShippingStatus }))}
        >
          <SelectTrigger className="w-[300px]">
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
      </div>
    </div>
  )

  const renderAdditionalInfo = () => (
    <div className="space-y-6 p-6 pt-0">
      <div className=" space-y-2">
        <Label htmlFor="customerNotes">Notas del Cliente</Label>
        <Input
          id="customerNotes"
          name="customerNotes"
          value={formData.customerNotes}
          onChange={handleChange}
          readOnly
          className="  cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Notas Internas</Label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          value={formData.internalNotes}
          onChange={handleChange}
          className="flex h-32 w-full  rounded-md border border-input bg-background px-3 py-2 text-sm ring-0 placeholder:text-muted-foreground focus-visible:outline-none   focus-visible:ring-0 "
          rows={4}
        />
      </div>
    </div>
  )

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <h3>Nuevo Pedido</h3>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="create-button" disabled={isLoading}>
            {isLoading ? "Cargando..." : orderId ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </div>
      </header>

      <div className="  bg-background">
        <div className="grid grid-cols-[65%_35%] gap-6 overflow-x-hidden">
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 border-r border-border ">
              {renderOrderDetails()}

              {renderPaymentAndDiscounts()}
              {renderAdditionalInfo()}
            </div>
          </ScrollArea>
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 container-section">
              {renderCustomerInfo()}
              {renderShippingAndBilling()}
              {renderOrderStatus()}
            </div>
          </ScrollArea>
        </div>
      </div>

      <ProductSelectionDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        products={products}
        selectedCurrency={formData.currencyId}
        onConfirm={handleProductSelection}
        currentLineItems={formData.lineItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
        }))}
      />

      <CreateUserDialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} onUserCreated={handleUserCreated} />
      {formData.customerId && (
        <CreateAddressDialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
          customerId={formData.customerId}
          onAddressCreated={handleAddressCreated}
        />
      )}
    </div>
  )
}

export default function NewOrderPage() {
  return <OrderForm />
}
