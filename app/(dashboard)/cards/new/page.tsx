"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { Loader2 } from "lucide-react"
import type { CreateCardSectionDto, CardDto } from "@/types/card"
import { CardSectionHeader } from "../_components/CardSectionHeader"
import { CardSectionForm } from "../_components/CardSectionForm"

export default function NewCardSectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createCardSection, currentStore } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState<CreateCardSectionDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Configuración para el sistema de fetching mejorado
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 5 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Modificar la función loadInitialData para que espere a currentStore
  const loadInitialData = async (forceRefresh = false) => {
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
        loadInitialData(true)
      }, delay)

      return
    }

    // Si llegamos aquí, ya tenemos currentStore
    setIsLoading(false)
    setFetchAttempts(0)
    setLastFetchTime(Date.now())
  }

  // Simplificar el useEffect para que solo dependa de currentStore
  useEffect(() => {
    if (!currentStore) {
      setIsLoading(true)
      loadInitialData()
    } else {
      setIsLoading(false)
    }

    return () => {
      // Limpiar cualquier fetch pendiente al desmontar
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [currentStore])

  // Añadir esta función para actualizar el estado del formulario
  const updateFormState = (data: CreateCardSectionDto) => {
    setFormState(data)
  }

  // Modificar la función handleSubmit para verificar que haya al menos una tarjeta
  const handleSubmit = async (formData?: CreateCardSectionDto) => {
    // Si no hay formData, usar formState si está disponible
    const dataToSubmit = formData || formState

    if (!dataToSubmit) return

    if (!dataToSubmit.title?.trim()) {
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
      const { cards, ...sectionData } = dataToSubmit

      // Asegurarse de que storeId esté incluido
      const dataToCreate: CreateCardSectionDto = {
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

        dataToCreate.cards = mappedCards
      }

      await createCardSection(dataToCreate)

      toast({
        title: "Sección creada",
        description: "La sección de tarjetas ha sido creada correctamente",
      })

      router.push("/cards")
    } catch (error) {
      console.error("Error al guardar la sección:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al guardar la sección. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preparar los datos JSON para el visor - solo lo que se envía en la creación
  const jsonData = formState
    ? {
        ...formState,
        storeId: currentStore,
      }
    : null

  // Mapear las tarjetas al formato esperado por el backend
  if (jsonData && jsonData.cards) {
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

  // Mostrar un estado de carga mejorado
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Preparando formulario...</p>
        {fetchAttempts > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Intento {fetchAttempts}/{MAX_RETRIES}...
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <CardSectionHeader
        title="Crear Nueva Sección"
        subtitle="Configura todos los detalles de tu sección de tarjetas"
        isSubmitting={isSubmitting}
        onSubmit={() => handleSubmit()}
        jsonData={jsonData}
        jsonLabel="Datos a enviar"
      />
      <CardSectionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onFormChange={updateFormState} />
    </>
  )
}
