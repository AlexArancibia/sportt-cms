"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreateAddressDialog } from "../_components/CreateAddressDialog"
import { CreateUserDialog } from "../_components/CreateUserDialog"
import { ProductSelectionDialog } from "../_components/ProductSelectionDialog"
import { CustomerInfo } from "../_components/CustomerInfo"
import { OrderDetails } from "../_components/OrderDetails"
import { ShippingAndBilling } from "../_components/ShippingAndBilling"
import { PaymentAndDiscounts } from "../_components/PaymentAndDiscounts"
import { OrderStatus } from "../_components/OrderStatus"
import { AdditionalInfo } from "../_components/AdditionalInfo"

import type { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto } from "@/types/order"
import type { Address } from "@/types/address"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"

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

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState<boolean>(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState<boolean>(false)

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

  const loadData = useCallback(async () => {
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
        if (order) {
          // Convert Order to CreateOrderDto & Partial<UpdateOrderDto>
          // Ensure all lineItems have a defined variantId
          const convertedOrder = {
            ...order,
            lineItems:
              order.lineItems
                ?.filter((item) => item.variantId !== undefined)
                .map(
                  (item) =>
                    ({
                      variantId: item.variantId as string,
                      title: item.title,
                      price: item.price,
                      quantity: item.quantity,
                      totalDiscount: item.totalDiscount,
                    }) as CreateOrderItemDto,
                ) || [],
          }
          setFormData(convertedOrder)
        }
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

  useEffect(() => {
    loadData()
  }, [loadData])

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
          // Add lineItems with defined variantId
          lineItems:
            formData.lineItems
              ?.filter((item) => item.variantId !== undefined)
              .map((item) => ({
                ...item,
                variantId: item.variantId as string, // Cast to string since we filtered out undefined values
              })) || [],
        }
        await updateOrder(orderId, updateData)
      } else {
        // For new orders, ensure all lineItems have a defined variantId
        const createData: CreateOrderDto = {
          ...formData,
          lineItems:
            formData.lineItems
              ?.filter((item) => item.variantId !== undefined)
              .map((item) => ({
                ...item,
                variantId: item.variantId as string, // Cast to string since we filtered out undefined values
              })) || [],
        }
        await createOrder(createData)
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

      <div className="bg-background">
        <div className="grid grid-cols-[65%_35%] gap-6 overflow-x-hidden">
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 border-r border-border">
              <OrderDetails
                formData={formData}
                setFormData={setFormData}
                products={products}
                currencies={currencies}
                coupons={coupons}
                shippingMethods={shippingMethods}
                shopSettings={shopSettings}
                setIsProductDialogOpen={setIsProductDialogOpen}
              />
              <PaymentAndDiscounts formData={formData} setFormData={setFormData} paymentProviders={paymentProviders} />
              <AdditionalInfo formData={formData} setFormData={setFormData} />
            </div>
          </ScrollArea>
          <ScrollArea className="h-[calc(100vh-3.7em)]">
            <div className="space-y-6 container-section">
              <CustomerInfo
                formData={formData}
                setFormData={setFormData}
                customers={customers}
                setIsUserDialogOpen={setIsUserDialogOpen}
              />
              <ShippingAndBilling
                formData={formData}
                setFormData={setFormData}
                customers={customers}
                setIsAddressDialogOpen={setIsAddressDialogOpen}
              />
              <OrderStatus formData={formData} setFormData={setFormData} />
            </div>
          </ScrollArea>
        </div>
      </div>

      <ProductSelectionDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        products={products}
        selectedCurrency={formData.currencyId}
        onConfirm={(selections) => {
          // Create CreateOrderItemDto objects instead of OrderItem objects
          const newLineItems: CreateOrderItemDto[] = selections.map((selection) => {
            const product = products.find((p) => p.id === selection.productId)!
            const variant = selection.variantId
              ? product.variants.find((v) => v.id === selection.variantId)!
              : product.variants[0]

            return {
              variantId: variant.id, // This is guaranteed to be a string
              title: variant.title || product.title || "",
              price: variant.prices.find((p) => p.currencyId === formData.currencyId)?.price || 0,
              quantity: 1,
              totalDiscount: 0,
            }
          })

          setFormData((prev) => ({
            ...prev,
            lineItems: newLineItems,
          }))
        }}
        currentLineItems={formData.lineItems.map((item) => {
          // Find the product that contains this variant
          const product = products.find((p) => p.variants.some((v) => v.id === item.variantId))
          return {
            productId: product?.id || "",
            variantId: item.variantId || null,
          }
        })}
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

