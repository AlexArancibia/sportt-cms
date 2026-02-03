"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useCardSectionById, useCardSectionMutations } from "@/hooks/useCardSections"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { CardSection, UpdateCardSectionDto } from "@/types/card"
import { CardSectionHeader } from "../../_components/CardSectionHeader"
import { CardSectionForm } from "../../_components/CardSectionForm"
import { prepareCardSectionData } from "@/lib/cardSectionUtils"
import {
  validateCardSection,
  type CardSectionValidationError,
} from "@/lib/cardSectionValidation"

export default function EditCardSectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const cardSectionId = params.id as string

  const { data: cardSection, isLoading, isError, error, refetch } = useCardSectionById(
    currentStoreId,
    cardSectionId,
    !!currentStoreId && !!cardSectionId
  )
  const { updateCardSection } = useCardSectionMutations(currentStoreId)

  const [formState, setFormState] = useState<UpdateCardSectionDto | null>(null)
  const [validationErrors, setValidationErrors] = useState<CardSectionValidationError[]>([])
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const updateFormState = (data: UpdateCardSectionDto) => {
    setFormState(data)
    if (hasAttemptedSubmit) {
      setValidationErrors(validateCardSection(data))
    }
  }

  const handleSubmit = async (formData?: UpdateCardSectionDto) => {
    setHasAttemptedSubmit(true)
    const dataToSubmit = (formData || formState || cardSection) ?? null

    if (!dataToSubmit) {
      const errors = validateCardSection(null)
      setValidationErrors(errors)
      toast({
        variant: "destructive",
        title: "Errores de validación",
        description: "No se recibieron datos del formulario.",
      })
      return
    }

    const errors = validateCardSection(dataToSubmit as UpdateCardSectionDto)
    if (errors.length > 0) {
      setValidationErrors(errors)
      const firstError = errors[0]?.message ?? "Revise los campos obligatorios."
      toast({
        variant: "destructive",
        title: "Errores de validación",
        description: errors.length > 1 ? `${firstError} (+${errors.length - 1} más)` : firstError,
      })
      return
    }

    setValidationErrors([])

    try {
      const cleanedData = prepareCardSectionData(dataToSubmit)
      if (!cleanedData) throw new Error("Error al preparar los datos para la actualización")

      await updateCardSection.mutateAsync({ sectionId: cardSectionId, data: cleanedData })

      toast({
        title: "Sección actualizada",
        description: "La sección de tarjetas ha sido actualizada correctamente",
      })

      router.push("/cards")
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al actualizar la sección. Por favor, inténtelo de nuevo.",
      })
    }
  }

  const jsonData = formState
    ? prepareCardSectionData(formState)
    : cardSection
      ? prepareCardSectionData(cardSection)
      : null

  if (!currentStoreId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Selecciona una tienda para continuar.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando datos de la sección...</p>
      </div>
    )
  }

  if (isError || !cardSection) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message ?? `No se encontró la sección de tarjetas con ID: ${cardSectionId}`}
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => router.push("/cards")}>
            Volver a la lista de secciones
          </Button>
          <Button variant="default" onClick={() => refetch()}>
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
        isSubmitting={updateCardSection.isPending}
        onSubmit={() => handleSubmit()}
        jsonData={jsonData}
        jsonLabel="Datos a enviar"
      />
      <CardSectionForm
        initialData={cardSection}
        onSubmit={handleSubmit}
        isSubmitting={updateCardSection.isPending}
        onFormChange={updateFormState}
        validationErrors={hasAttemptedSubmit ? validationErrors : []}
        showValidation={hasAttemptedSubmit}
      />
    </>
  )
}
