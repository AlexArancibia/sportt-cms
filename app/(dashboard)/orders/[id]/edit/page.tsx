"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStores, useStoresByOwner } from "@/hooks/useStores"
import { useOrderById } from "@/hooks/useOrderById"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OrderForm } from "../../_components/OrderForm"

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const { user, currentStoreId: authCurrentStoreId } = useAuthStore()
  const ownerId = user?.id ?? null
  const { currentStoreId, setCurrentStore, stores: authStores } = useStores()
  const { data: storesByOwner = [], isLoading: isLoadingStores } = useStoresByOwner(ownerId)

  const orderId = params.id as string
  const targetStoreId = authCurrentStoreId || currentStoreId
  const stores = authStores.length > 0 ? authStores : storesByOwner

  const { data: order, isLoading: isLoadingOrder, error: orderError } = useOrderById(
    targetStoreId ?? null,
    orderId,
    !!targetStoreId && !!orderId
  )

  useEffect(() => {
    if (authCurrentStoreId && authCurrentStoreId !== currentStoreId) setCurrentStore(authCurrentStoreId)
    if (!targetStoreId && stores.length > 0) setCurrentStore(stores[0].id)
  }, [authCurrentStoreId, currentStoreId, setCurrentStore, stores, targetStoreId])

  const error =
    !targetStoreId && stores.length > 0
      ? "No hay tienda seleccionada. Por favor, seleccione una tienda primero."
      : orderError
        ? (orderError as { response?: { status?: number } })?.response?.status === 404
          ? `No se encontró el pedido con ID: ${orderId}`
          : "Error al cargar los datos del pedido. Por favor, inténtelo de nuevo."
        : null

  const isLoading =
    (!!targetStoreId && isLoadingOrder) || (!targetStoreId && !!ownerId && stores.length === 0 && isLoadingStores)

  return (
    <div className="container mx-auto py-6 px-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos del pedido...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Volver a la lista de pedidos
            </Button>
          </div>
        </Alert>
      ) : (
        <OrderForm orderId={orderId} />
      )}
    </div>
  )
}
