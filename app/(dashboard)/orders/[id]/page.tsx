"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStores, useStoresByOwner } from "@/hooks/useStores"
import { useOrderById } from "@/hooks/useOrderById"
import { useOrderMutations } from "@/hooks/useOrderMutations"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useCoupons } from "@/hooks/useCoupons"
import { useShopSettings } from "@/hooks/useShopSettings"
import { usePaymentProviders } from "@/hooks/usePaymentProviders"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateInvoicePDF, type AddressInfo } from "@/lib/generateInvoice"
import { orderToFormState, extractShippingAndBilling } from "../_components/orderToFormState"
import { ViewOrderContent } from "../_components/ViewOrderContent"
import { useStorePermissions, hasPermission } from "@/hooks/auth/useStorePermissions"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, currentStoreId: authCurrentStoreId } = useAuthStore()
  const ownerId = user?.id ?? null
  const { currentStoreId, setCurrentStore, stores: authStores } = useStores()
  const { data: storesByOwner = [] } = useStoresByOwner(ownerId)
  const orderId = params.id as string
  const targetStoreId = authCurrentStoreId || currentStoreId
  const stores = authStores.length > 0 ? authStores : storesByOwner

  const { data: currenciesData = [] } = useCurrencies()
  const { data: couponsData = [] } = useCoupons(targetStoreId ?? null, !!targetStoreId)
  const { data: shopSettingsData } = useShopSettings(targetStoreId ?? null)
  const { data: paymentProvidersData = [] } = usePaymentProviders(targetStoreId ?? null, !!targetStoreId)

  const { data: order, isLoading, error: orderError } = useOrderById(
    targetStoreId ?? null,
    orderId,
    !!targetStoreId && !!orderId
  )
  const { data: storePermissions } = useStorePermissions(targetStoreId ?? null)
  const canEditOrder = hasPermission(storePermissions, "orders:update")
  const canDeleteOrder = hasPermission(storePermissions, "orders:delete")
  const { deleteOrder } = useOrderMutations(targetStoreId ?? null)
  const isDeleting = deleteOrder.isPending

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (authCurrentStoreId && authCurrentStoreId !== currentStoreId) setCurrentStore(authCurrentStoreId)
  }, [authCurrentStoreId, currentStoreId, setCurrentStore])

  const error =
    !targetStoreId && stores.length > 0
      ? "No hay tienda seleccionada. Por favor, seleccione una tienda primero."
      : orderError
        ? (orderError as { response?: { status?: number } })?.response?.status === 404
          ? `No se encontró el pedido con ID: ${orderId}`
          : "Error al cargar los datos del pedido. Por favor, inténtelo de nuevo."
        : null

  const store = useMemo(() => {
    const s = stores.find((s) => s.id === targetStoreId)
    return s ? { id: s.id, name: s.name } : null
  }, [stores, targetStoreId])
  const currency = useMemo(
    () => currenciesData.find((c) => c.id === order?.currencyId) ?? null,
    [currenciesData, order?.currencyId]
  )

  const formData = useMemo(() => {
    if (!order) return null
    return orderToFormState(order, {
      coupons: couponsData,
      shopSettingsForOrder: shopSettingsData ?? null,
    })
  }, [order, couponsData, shopSettingsData])

  const handleGenerateInvoice = () => {
    if (!order) return
    const { shippingAddress, billingAddress } = extractShippingAndBilling(order)
    const hasShipping =
      !!(shippingAddress.address1 || shippingAddress.city || shippingAddress.country)
    const hasBilling =
      !!(billingAddress.address1 || billingAddress.city || billingAddress.country)
    const storeInfo =
      store || shopSettingsData
        ? {
            name: store?.name ?? shopSettingsData?.name ?? "Tienda",
            domain: shopSettingsData?.domain ?? undefined,
            email: shopSettingsData?.email ?? undefined,
            phone: shopSettingsData?.phone ?? undefined,
            address1: shopSettingsData?.address1 ?? undefined,
            address2: shopSettingsData?.address2 ?? undefined,
            city: shopSettingsData?.city ?? undefined,
            province: shopSettingsData?.province ?? undefined,
            country: shopSettingsData?.country ?? undefined,
            zip: shopSettingsData?.zip ?? undefined,
            primaryColor: shopSettingsData?.primaryColor ?? undefined,
          }
        : undefined
    generateInvoicePDF(
      {
        orderNumber: String(order.orderNumber),
        createdAt: new Date(order.createdAt).toISOString(),
        subtotalPrice: order.subtotalPrice,
        totalDiscounts: order.totalDiscounts,
        totalTax: order.totalTax,
        totalPrice: order.totalPrice,
        lineItems: (order.lineItems ?? []).map((item) => ({
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          totalDiscount: item.totalDiscount ?? 0,
        })),
        customerInfo: order.customerInfo
          ? {
              name: order.customerInfo.name,
              email: order.customerInfo.email,
              phone: order.customerInfo.phone,
              company: order.customerInfo.company,
              taxId: order.customerInfo.taxId,
            }
          : undefined,
        shippingAddress: hasShipping ? (shippingAddress as AddressInfo) : undefined,
        billingAddress: hasBilling ? (billingAddress as AddressInfo) : undefined,
      },
      currency ?? undefined,
      storeInfo ?? undefined
    )
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteOrder = () => {
    if (!orderId) return
    deleteOrder.mutate(orderId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        toast({ title: "Pedido eliminado", description: "El pedido ha sido eliminado correctamente" })
        router.push("/orders")
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el pedido. Por favor, inténtelo de nuevo.",
        })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos del pedido...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Volver a la lista de pedidos
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (!order || !formData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert className="mb-6">
          <AlertTitle>Pedido no encontrado</AlertTitle>
          <AlertDescription>No se pudo encontrar el pedido con ID: {orderId}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Volver a la lista de pedidos
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <ViewOrderContent
        formData={formData}
        orderId={orderId}
        currencies={currenciesData}
        store={store}
        shopSettings={shopSettingsData ?? null}
        paymentProviders={paymentProvidersData}
        onGenerateInvoice={handleGenerateInvoice}
        onDeleteClick={handleDeleteClick}
        canEdit={canEditOrder}
        canDelete={canDeleteOrder}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
