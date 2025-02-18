"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreateAddressDialog } from "./CreateAddressDialog"
import { CreateUserDialog } from "./CreateUserDialog"
import { ProductSelectionDialog } from "./ProductSelectionDialog"
import { CustomerInfo } from "./CustomerInfo"
import { OrderDetails } from "./OrderDetails"
import { ShippingAndBilling } from "./ShippingAndBilling"
import { PaymentAndDiscounts } from "./PaymentAndDiscounts"
import { OrderStatus } from "./OrderStatus"
import { AdditionalInfo } from "./AdditionalInfo"

import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
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
          setFormData((prev) => ({
            ...prev,
            lineItems: selections.map((selection) => ({
              productId: selection.productId,
              variantId: selection.variantId || undefined,
              title: "",
              price: 0,
              quantity: 1,
              totalDiscount: 0,
            })),
          }))
        }}
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

