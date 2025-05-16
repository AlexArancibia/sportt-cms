"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { CardSection, UpdateCardSectionDto, CardDto } from "@/types/card"
import { CardSectionHeader } from "../../_components/CardSectionHeader"
import { CardSectionForm } from "../../_components/CardSectionForm"

export default function EditCardSectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fetchCardSectionsByStore, cardSections, currentStore, fetchCardSection, updateCardSection } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardSection, setCardSection] = useState<CardSection | null>(null)
  const [formState, setFormState] = useState<UpdateCardSectionDto | null>(null)

  // Configuración para el sistema de fetching mejorado
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 5 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cardSectionId = params.id as string

  // Función mejorada para cargar datos
  const loadData = async (forceRefresh = false) => {
    // Evitar fetches duplicados o muy frecuentes
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Fetch cooldown active, using cached data")
      return
    }

    // Limpiar cualquier timeout pendiente
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    // Si no hay tienda seleccionada, simplemente esperar
    if (!currentStore) {
      console.log("No hay tienda seleccionada, esperando...")

      // Programar un reintento
      const delay = RETRY_DELAY_MS
      fetchTimeoutRef.current = setTimeout(() => {
        loadData(true)
      }, delay)

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Si tenemos una tienda seleccionada y las secciones no están cargadas, cargarlas
      if (cardSections.length === 0) {
        await fetchCardSectionsByStore(currentStore)
      }

      // Verificar si la sección ya está en el estado
      const sectionExists = cardSections.some((section) => section.id === cardSectionId)

      if (!sectionExists) {
        try {
          const section = await fetchCardSection(cardSectionId)
          setCardSection(section)
        } catch (err) {
          throw new Error(`No se encontró la sección de tarjetas con ID: ${cardSectionId}`)
        }
      } else {
        // Si la sección ya está en el estado, usarla
        const section = cardSections.find((section) => section.id === cardSectionId)
        setCardSection(section as CardSection)
      }

      // Restablecer los contadores de reintento
      setFetchAttempts(0)
      setLastFetchTime(Date.now())
    } catch (err) {
      console.error("Error al cargar datos:", err)

      // Implementar reintento con backoff exponencial
      if (fetchAttempts < MAX_RETRIES) {
        const nextAttempt = fetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Backoff exponencial

        console.log(`Reintentando carga en ${delay}ms (intento ${nextAttempt}/${MAX_RETRIES})`)

        setFetchAttempts(nextAttempt)
        fetchTimeoutRef.current = setTimeout(() => {
          loadData(true)
        }, delay)
      } else {
        // Solo mostrar error después de agotar todos los reintentos
        setError(
          "Error al cargar los datos de la sección después de múltiples intentos. Por favor, inténtelo de nuevo.",
        )
        setFetchAttempts(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    return () => {
      // Limpiar cualquier fetch pendiente al desmontar
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [cardSectionId, currentStore, cardSections.length])

  // Añadir esta función para actualizar el estado del formulario
  const updateFormState = (data: UpdateCardSectionDto) => {
    setFormState(data)
  }

  // Modificar la función handleSubmit para verificar que haya al menos una tarjeta
  const handleSubmit = async (formData?: UpdateCardSectionDto) => {
    // Si no hay formData, usar formState o cardSection
    const dataToSubmit = formData || formState || cardSection

    if (!dataToSubmit?.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título de la sección es obligatorio",
      })
      return
    }

    // Verificar que haya al menos una tarjeta
    if (!dataToSubmit.cards || dataToSubmit.cards.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe añadir al menos una tarjeta antes de guardar la sección",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar los datos para enviar al backend
      const { cards, ...sectionData } = dataToSubmit as UpdateCardSectionDto

      // Asegurarse de que storeId esté incluido
      const dataToUpdate: UpdateCardSectionDto = {
        ...sectionData,
        storeId: currentStore!,
      }

      // Si hay tarjetas, mapearlas al formato esperado por el backend
      if (cards && cards.length > 0) {
        const mappedCards: CardDto[] = cards.map((card) => ({
          title: card.title,
          subtitle: card.subtitle || undefined,
          description: card.description || undefined,
          imageUrl: card.imageUrl || undefined,
          linkUrl: card.linkUrl || undefined,
          linkText: card.linkText || undefined,
          position: card.position,
          isActive: card.isActive,
        }))

        dataToUpdate.cards = mappedCards
      }

      await updateCardSection(cardSectionId, dataToUpdate)

      toast({
        title: "Sección actualizada",
        description: "La sección de tarjetas ha sido actualizada correctamente",
      })

      router.push("/cards")
    } catch (error) {
      console.error("Error al actualizar la sección:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al actualizar la sección. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preparar los datos JSON para el visor - solo lo que se envía en el update
  const jsonData = formState
    ? {
        ...formState,
        storeId: currentStore,
      }
    : null

  // Eliminar campos que no se envían en la actualización
  if (jsonData) {
 

    // Limpiar campos de las tarjetas y mapear al formato esperado por el backend
    if (jsonData.cards) {
      jsonData.cards = jsonData.cards.map((card) => {
        return {
          title: card.title,
          subtitle: card.subtitle || undefined,
          description: card.description || undefined,
          imageUrl: card.imageUrl || undefined,
          linkUrl: card.linkUrl || undefined,
          linkText: card.linkText || undefined,
          position: card.position,
          isActive: card.isActive,
        }
      })
    }
  }

  // Mostrar un estado de carga mejorado
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando datos de la sección...</p>
        {fetchAttempts > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Intento {fetchAttempts}/{MAX_RETRIES}...
          </p>
        )}
      </div>
    )
  }

  // Solo mostrar error después de agotar todos los reintentos
  if (error && fetchAttempts === 0) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => router.push("/cards")}>
            Volver a la lista de secciones
          </Button>
          <Button variant="default" onClick={() => loadData(true)}>
            Reintentar
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <>
      <CardSectionHeader
        title="Editar Sección"
        subtitle="Configura todos los detalles de tu sección de tarjetas"
        isSubmitting={isSubmitting}
        onSubmit={() => handleSubmit()}
        jsonData={jsonData}
        jsonLabel="Datos a enviar"
      />
      <CardSectionForm
        initialData={cardSection}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onFormChange={updateFormState}
      />
    </>
  )
}
