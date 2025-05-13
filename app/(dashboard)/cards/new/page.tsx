"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Store } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { CardSectionForm } from "../_components/CardSectionForm"

export default function NewCardSectionPage() {
  const router = useRouter()
  const { currentStore, stores, fetchStores } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si no hay tiendas cargadas, cargarlas primero
        if (stores.length === 0) {
          await fetchStores()
        }

        // Verificar si hay una tienda seleccionada
        if (!currentStore && stores.length > 0) {
          setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos iniciales. Por favor, inténtelo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentStore, fetchStores, stores])

  // Obtener el nombre de la tienda actual para mostrarlo
  const currentStoreName = stores.find((store) => store.id === currentStore)?.name || "Tienda"

  return (
    <div className="container mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button variant="outline" size="icon" onClick={() => router.push("/card-sections")} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Nueva Sección de Tarjetas
          </h1>
          <p className="text-muted-foreground">
            {currentStore ? `Tienda: ${currentStoreName}` : "Seleccione una tienda"}
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos iniciales...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/card-sections")}>
              Volver a la lista de secciones
            </Button>
          </div>
        </Alert>
      ) : !currentStore ? (
        <Alert className="mb-6">
          <Store className="h-4 w-4" />
          <AlertTitle>No hay tienda seleccionada</AlertTitle>
          <AlertDescription>Seleccione una tienda para crear una nueva sección de tarjetas.</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/card-sections")}>
              Volver a la lista de secciones
            </Button>
          </div>
        </Alert>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <CardSectionForm  />
        </motion.div>
      )}
    </div>
  )
}
