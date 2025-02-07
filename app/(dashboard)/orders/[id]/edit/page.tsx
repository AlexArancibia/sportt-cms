"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, UserIcon, CircleDollarSign, ArrowLeft, Trash2 } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { HeaderBar } from "@/components/HeaderBar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { Order, OrderItem } from "@/types/order"
import type { Address } from "@/types/address"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
 
import type { Product } from "@/types/product"
import type { UpdateOrderDto } from "@/types/order"
import { ProductSelectionDialog } from "../../_components/ProductSelectionDialog"
import { CreateUserDialog } from "../../_components/CreateUserDialog"
import { CreateAddressDialog } from "../../_components/CreateAddressDialog"



export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  console.log("Rendering EditOrderPage with params:", resolvedParams)
  const router = useRouter()
  const { toast } = useToast()
  const {
    updateOrder,
    getOrderById,
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
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isEditingProducts, setIsEditingProducts] = useState(false)

  const [formData, setFormData] = useState<Order>({} as Order)

  const calculateTotals = (formData: Order) => {
    const subtotal =
      formData.lineItems?.reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 0)
      }, 0) || 0
  
    const taxRate = 0.18 // 18% de impuesto (ajusta según sea necesario)
    const tax = subtotal * taxRate
    const discount = formData.totalDiscounts || 0
  
    const shipmentMethod = shippingMethods.find((s) => s.id === formData.shippingMethodId)
    const shipmentCost = Number(shipmentMethod?.price ?? 0)
  
    const total = subtotal + tax - discount + shipmentCost
  
    return { subtotal, tax, discount, total, shipmentCost }
  }

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

        const order = await getOrderById(resolvedParams.id)
        console.log("Fetched order:", order)
        if (order) {
          setFormData(order)
          console.log("FormData set to:", order)
        } else {
          console.log("Order not found")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Order not found",
          })
          router.push("/orders")
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load order data. Please try again.",
        })
      } finally {
        setIsLoading(false)
        console.log("Finished loading data")
      }
    }

    loadData()
  }, [
    resolvedParams.id,
    getOrderById,
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await Promise.all([
        updateCustomerInfo(),
        updateShippingInfo(),
        updatePaymentInfo(),
        updateOrderStatus(),
        updateAdditionalInfo(),
      ])
      console.log("Order updated successfully")
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      router.push("/orders")
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCustomerInfo = async () => {
    const updateData: UpdateOrderDto = {
      customerId: formData.customerId,
    }
    await updateOrder(resolvedParams.id, updateData)
  }

  const updateShippingInfo = async () => {
    const updateData: UpdateOrderDto = {
      shippingAddressId: formData.shippingAddressId,
      billingAddressId: formData.billingAddressId,
      shippingMethodId: formData.shippingMethodId,
      shippingStatus: formData.shippingStatus,
      trackingNumber: formData.trackingNumber,
      trackingUrl: formData.trackingUrl,
      estimatedDeliveryDate: formData.estimatedDeliveryDate,
      shippedAt: formData.shippedAt,
      deliveredAt: formData.deliveredAt,
    }
    await updateOrder(resolvedParams.id, updateData)
  }

  const updatePaymentInfo = async () => {
    const updateData: UpdateOrderDto = {
      paymentProviderId: formData.paymentProviderId,
      paymentStatus: formData.paymentStatus,
      paymentDetails: formData.paymentDetails,
    }
    await updateOrder(resolvedParams.id, updateData)
  }

  const updateOrderStatus = async () => {
    const updateData: UpdateOrderDto = {
      financialStatus: formData.financialStatus,
      fulfillmentStatus: formData.fulfillmentStatus,
    }
    await updateOrder(resolvedParams.id, updateData)
  }

  const updateAdditionalInfo = async () => {
    const updateData: UpdateOrderDto = {
      customerNotes: formData.customerNotes,
      internalNotes: formData.internalNotes,
      preferredDeliveryDate: formData.preferredDeliveryDate,
    }
    await updateOrder(resolvedParams.id, updateData)
  }

  const updateFormDataTotals = useCallback(() => {
    console.log("Updating form data totals")
    setFormData((prev) => {
      const { subtotal, tax, discount, total } = calculateTotals(prev)
      console.log("Calculated totals:", { subtotal, tax, discount, total })
      return {
        ...prev,
        totalPrice: total,
        subtotalPrice: subtotal,
        totalTax: tax,
        totalDiscounts: discount,
      }
    })
  }, [])

  useEffect(() => {
    updateFormDataTotals()
  }, [
    formData.lineItems,
    formData.shippingMethodId,
    formData.currencyId,
    products,
    formData.totalDiscounts,
    shippingMethods,
    formData.couponId,
  ])

  const handleProductSelection = (selections: Array<{ productId: string; variantId: string | null }>) => {
    console.log("handleProductSelection called with:", selections)

    setFormData((prev) => {
      const updatedLineItems = [...(prev.lineItems || [])]

      selections.forEach((selection) => {
        const existingItemIndex = updatedLineItems.findIndex(
          (item) => item.productId === selection.productId && item.variantId === selection.variantId,
        )

        if (existingItemIndex !== -1) {
          // If the item already exists, increase its quantity
          updatedLineItems[existingItemIndex] = {
            ...updatedLineItems[existingItemIndex],
            quantity: (updatedLineItems[existingItemIndex].quantity || 0) + 1,
          }
        } else {
          // If it's a new item, add it to the array
          const product = products.find((p) => p.id === selection.productId)
          const variant = selection.variantId ? product?.variants.find((v) => v.id === selection.variantId) : null

          const newItem: OrderItem = {
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: prev.id,
            productId: selection.productId,
            variantId: selection.variantId || undefined,
            title: variant ? variant.title : product?.title || "",
            price: variant
              ? variant.prices.find((p) => p.currencyId === prev.currencyId)?.price || 0
              : product?.prices.find((p) => p.currencyId === prev.currencyId)?.price || 0,
            quantity: 1,
            totalDiscount: 0,
            product: product as Product,
            order: prev,
            refundLineItems: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          updatedLineItems.push(newItem)
        }
      })

      console.log("Updated line items:", updatedLineItems)
      return {
        ...prev,
        lineItems: updatedLineItems,
      }
    })

    updateFormDataTotals()
  }

  const handleUserCreated = (userId: string) => {
    setFormData((prev) => ({ ...prev, customerId: userId }))
    updateCustomerInfo()
    fetchCustomers()
  }

  const handleAddressCreated = (address: Address) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddressId: address.id,
      billingAddressId: address.id,
    }))
    updateShippingInfo()
  }

  const handleConfirmProductUpdate = async () => {
    setIsEditingProducts(true)
    const updatedLineItems = await Promise.all(
      formData.lineItems.map(async (item) => {
        const product = products.find((p) => p.id === item.productId)
        const variant = product?.variants.find((v) => v.id === item.variantId)
        const updatedPrice = variant
          ? variant.prices.find((p) => p.currencyId === formData.currencyId)?.price
          : product?.prices.find((p) => p.currencyId === formData.currencyId)?.price

        return {
          ...item,
          price: updatedPrice || item.price,
          product: product || item.product,
        }
      }),
    )

    setFormData((prev) => ({
      ...prev,
      lineItems: updatedLineItems,
    }))
    updateFormDataTotals()
  }

  const handleDeleteItem = (index: number) => {
    if (isEditingProducts) {
      setFormData((prev) => {
        const updatedLineItems = [...prev.lineItems]
        updatedLineItems.splice(index, 1)
        return {
          ...prev,
          lineItems: updatedLineItems,
        }
      })
      updateFormDataTotals()
    }
  }

  const renderOrderDetails = () => {
    console.log("Rendering order details")
    const { subtotal, tax, discount, total, shipmentCost } = calculateTotals(formData)
    console.log("Calculated totals for rendering:", { subtotal, tax, discount, total, shipmentCost })
    return (
      <div className="space-y-3">
        <div className="space-y-1 flex justify-between items-center container-section pb-0">
          <h4>Detalles del Pedido</h4>
          <div className="flex gap-2">
            <Select
              value={formData.currencyId}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, currencyId: value }))
                updateFormDataTotals()
              }}
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
            {isEditingProducts ? (
              <Button
                variant="outline"
                className="shadow-none h-8 px-2 text-sm"
                onClick={() => setIsProductDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Productos
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="shadow-none h-8 px-2 text-sm">
                    Editar Productos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La edición de productos está sujeta a actualizaciones de precios. ¿Deseas continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmProductUpdate}>Continuar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                  {isEditingProducts && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId)
                  const variant = product?.variants.find((v) => v.id === item.variantId)
                  const price = item.price || 0
                  const quantity = item.quantity || 0
                  const total = price * quantity

                  return (
                    <TableRow key={`${item.id || index}`}>
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
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <span>{item.title}</span>
                        )}
                      </TableCell>
                      <TableCell>{variant?.title || "N/A"}</TableCell>
                      <TableCell className="text-right">{price}</TableCell>
                      <TableCell className="text-right w-[100px]">
                        {isEditingProducts ? (
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                              const newQuantity = Number.parseInt(e.target.value, 10)
                              if (!isNaN(newQuantity) && newQuantity >= 1) {
                                const updatedLineItems = [...formData.lineItems]
                                updatedLineItems[index] = { ...updatedLineItems[index], quantity: newQuantity }
                                setFormData((prev) => ({
                                  ...prev,
                                  lineItems: updatedLineItems,
                                }))
                                updateFormDataTotals()
                              }
                            }}
                            className="w-20 text-right"
                          />
                        ) : (
                          quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">{total}</TableCell>
                      {isEditingProducts && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="space-y-1 text-sm px-6">
              <div className="flex justify-between">
                <Select
                  value={formData.couponId || ""}
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
                <span>{formData.totalDiscounts}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-primary/80">Subtotal</span>
                <span className="font-light">{formData.subtotalPrice}</span>
              </div>

              <div className="flex justify-between text-primary/80">
                <Select
                  value={formData.shippingMethodId || ""}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, shippingMethodId: value }))
                    updateShippingInfo()
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
                <span>{shipmentCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/80">Impuesto </span>
                <span>{formData.totalTax}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span className="text-primary/90">Total</span>
                <span>{formData.totalPrice}</span>
              </div>
            </div>
            {isEditingProducts && (
              <Button onClick={() => setIsEditingProducts(false)} className="mt-4">
                Finalizar Edición de Productos
              </Button>
            )}
          </>
        ) : (
          <div className="min-h-12 flex justify-center items-center text-xs text-foreground">
            Sin productos encontrados.
          </div>
        )}
      </div>
    )
  }

  const renderCustomerInfo = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerId">Cliente</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.customerId || ""}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, customerId: value }))
              updateCustomerInfo()
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
    </div>
  )

  const renderShippingAndBilling = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shippingAddressId">Shipping Address</Label>
        <div className="flex items-center gap-2">
          <Select
            value={formData.shippingAddressId || ""}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, shippingAddressId: value }))
              updateShippingInfo()
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
        <Label htmlFor="billingAddressId">Billing Address</Label>
        <Select
          value={formData.billingAddressId || ""}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, billingAddressId: value }))
            updateShippingInfo()
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
    </div>
  )

  const renderPaymentAndDiscounts = () => (
    <div className="space-y-6 px-6">
      <div className="space-y-2 flex flex-col">
        <Label htmlFor="preferredDeliveryDate" className="mb-1">
          Fecha de envío preferida
        </Label>
        <DatePicker
          date={formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate) : undefined}
          setDate={(date) => {
            setFormData((prev) => ({ ...prev, preferredDeliveryDate: date?.toISOString() }))
            updateAdditionalInfo()
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentProviderId" className="">
          Metodo de Pago
        </Label>
        <Select
          value={formData.paymentProviderId || ""}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, paymentProviderId: value }))
            updatePaymentInfo()
          }}
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
    </div>
  )

  const renderOrderStatus = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="financialStatus">Financial Status</Label>
        <Select
          value={formData.financialStatus || ""}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, financialStatus: value as OrderFinancialStatus }))
            updateOrderStatus()
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
        <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
        <Select
          value={formData.fulfillmentStatus || ""}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, fulfillmentStatus: value as OrderFulfillmentStatus }))
            updateOrderStatus()
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
        <Label htmlFor="shippingStatus">Shipping Status</Label>
        <Select
          value={formData.shippingStatus || ""}
          onValueChange={(value) => {
            setFormData((prev) => ({ ...prev, shippingStatus: value as ShippingStatus }))
            updateShippingInfo()
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
  )

  const renderAdditionalInfo = () => (
    <div className="space-y-6 p-6 pt-0">
      <div className="space-y-2">
        <Label htmlFor="customerNotes">Notas del Cliente</Label>
        <Input
          id="customerNotes"
          name="customerNotes"
          value={formData.customerNotes || ""}
          onChange={(e) => {
            handleChange(e)
            updateAdditionalInfo()
          }}
          readOnly
          className="cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Notas Internas</Label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          value={formData.internalNotes || ""}
          onChange={(e) => {
            handleChange(e)
            updateAdditionalInfo()
          }}
          className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
          rows={4}
        />
      </div>
    </div>
  )

  return (
    <> 
       
 
        <div className="text-foreground">
          <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
            <h3>Editar Pedido #{resolvedParams.id}</h3>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="create-button" disabled={isLoading}>
                {isLoading ? "Actualizando..." : "Actualizar Pedido"}
              </Button>
            </div>
          </header>

          <div className="bg-background">
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
            open={isProductDialogOpen && isEditingProducts}
            onOpenChange={(open) => {
              setIsProductDialogOpen(open)
              if (!open) setIsEditingProducts(false)
            }}
            products={products}
            selectedCurrency={formData.currencyId || ""}
            onConfirm={handleProductSelection}
            currentLineItems={
              formData.lineItems?.map((item) => ({
                productId: item.productId,
                variantId: item.variantId || null,
              })) || []
            }
          />

          <CreateUserDialog
            open={isUserDialogOpen}
            onOpenChange={setIsUserDialogOpen}
            onUserCreated={handleUserCreated}
          />
          {formData.customerId && (
            <CreateAddressDialog
              open={isAddressDialogOpen}
              onOpenChange={setIsAddressDialogOpen}
              customerId={formData.customerId}
              onAddressCreated={handleAddressCreated}
            />
          )}
        </div>
 
    </>
  )
}

