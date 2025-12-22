"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OrderForm } from "../../_components/OrderForm"

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchOrderById, currentStore, fetchStores, stores, setCurrentStore } = useMainStore()
  const { user, currentStoreId: authCurrentStoreId } = useAuthStore()
  const ownerId = user?.id ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  // Usar currentStoreId de authStore como fuente principal, con fallback a mainStore
  const targetStoreId = authCurrentStoreId || currentStore

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si no hay tiendas cargadas, cargarlas primero
        if (stores.length === 0) {
          if (!ownerId) {
            setIsLoading(false)
            return
          }
          await fetchStores(ownerId)
        }

        // Sincronizar mainStore con authStore si es necesario
        if (authCurrentStoreId && authCurrentStoreId !== currentStore) {
          setCurrentStore(authCurrentStoreId)
        }

        // Usar el storeId de authStore o mainStore
        const storeId = authCurrentStoreId || currentStore

        if (!storeId) {
          // Si aún no hay store, intentar usar el primero disponible
          const firstStore = stores.length > 0 ? stores[0].id : null
          if (firstStore) {
            setCurrentStore(firstStore)
            await fetchOrderById(firstStore, orderId)
            return
          }
          setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
          setIsLoading(false)
          return
        }

        // Buscar el pedido específico por ID
        await fetchOrderById(storeId, orderId)
      } catch (err: any) {
        console.error("Error al cargar datos:", err)
        if (err?.response?.status === 404) {
          setError(`No se encontró el pedido con ID: ${orderId}`)
        } else {
          setError("Error al cargar los datos del pedido. Por favor, inténtelo de nuevo.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orderId, targetStoreId, fetchOrderById, fetchStores, stores.length, ownerId, authCurrentStoreId, currentStore, setCurrentStore])

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
