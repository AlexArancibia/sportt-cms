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
  const { fetchOrdersByStore, orders, currentStore, fetchStores, stores } = useMainStore()
  const { user } = useAuthStore()
  const ownerId = user?.id ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

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

        // Si no hay pedidos cargados o si estamos cambiando de tienda, cargar los pedidos
        if (orders.length === 0 && currentStore) {
          await fetchOrdersByStore(currentStore)
        }

        // Verificar si el pedido existe
        const orderExists = orders.some((order) => order.id === orderId)

        if (!orderExists) {
          // Si el pedido no existe en la tienda actual, intentar cargarlo específicamente
          if (currentStore) {
            await fetchOrdersByStore(currentStore)

            // Verificar nuevamente si el pedido existe después de cargar
            const orderExistsAfterFetch = orders.some((order) => order.id === orderId)

            if (!orderExistsAfterFetch) {
              setError(`No se encontró el pedido con ID: ${orderId}`)
            }
          } else {
            setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
          }
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos del pedido. Por favor, inténtelo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orderId, currentStore, fetchOrdersByStore, fetchStores, orders, stores.length, ownerId])

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
