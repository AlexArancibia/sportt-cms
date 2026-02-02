"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useCardSectionMutations } from "@/hooks/useCardSections"
import { Loader2 } from "lucide-react"
import type { CreateCardSectionDto } from "@/types/card"
import { CardSectionHeader } from "../_components/CardSectionHeader"
import { CardSectionForm } from "../_components/CardSectionForm"
import { prepareCardSectionData } from "@/lib/cardSectionUtils"
import {
  validateCardSection,
  type CardSectionValidationError,
} from "@/lib/cardSectionValidation"

export default function NewCardSectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { createCardSection } = useCardSectionMutations(currentStoreId)

  const [formState, setFormState] = useState<CreateCardSectionDto | null>(null)
  const [validationErrors, setValidationErrors] = useState<CardSectionValidationError[]>([])
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const updateFormState = (data: CreateCardSectionDto) => {
    setFormState(data)
    if (hasAttemptedSubmit) {
      setValidationErrors(validateCardSection(data))
    }
  }

  const handleSubmit = async (formData?: CreateCardSectionDto) => {
    setHasAttemptedSubmit(true)
    const dataToSubmit = formData || formState

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

    const errors = validateCardSection(dataToSubmit)
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

    if (!dataToSubmit.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título de la sección es obligatorio",
      })
      return
    }

    if (!dataToSubmit.cards || dataToSubmit.cards.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe añadir al menos una tarjeta antes de guardar la sección",
      })
      return
    }

    try {
      const cleanedData = prepareCardSectionData(dataToSubmit)
      if (!cleanedData) throw new Error("Error al preparar los datos")

      await createCardSection.mutateAsync(cleanedData)

      toast({
        title: "Sección creada",
        description: "La sección de tarjetas ha sido creada correctamente",
      })

      router.push("/cards")
    } catch (error: unknown) {
      let message = "Ocurrió un error al guardar la sección. Por favor, inténtelo de nuevo."
      const data = (error as { response?: { data?: unknown } })?.response?.data
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>
        if (typeof d.message === "string") message = d.message
        else if (typeof d.error === "string") message = d.error
        else if (Array.isArray(d.message)) message = (d.message as string[]).join(", ")
        else if (d.errors) message = String(Array.isArray(d.errors) ? d.errors.join(", ") : Object.values(d.errors).flat().join(", "))
      }
      toast({ variant: "destructive", title: "Error", description: message })
    }
  }

  const jsonData = formState ? prepareCardSectionData(formState) : null

  if (!currentStoreId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Selecciona una tienda para continuar.</p>
      </div>
    )
  }

  return (
    <>
      <CardSectionHeader
        title="Crear Nueva Sección"
        subtitle="Configura todos los detalles de tu sección de tarjetas"
        isSubmitting={createCardSection.isPending}
        onSubmit={() => handleSubmit()}
        jsonData={jsonData}
        jsonLabel="Datos a enviar"
      />
      <CardSectionForm
        onSubmit={handleSubmit}
        isSubmitting={createCardSection.isPending}
        onFormChange={updateFormState}
        validationErrors={hasAttemptedSubmit ? validationErrors : []}
        showValidation={hasAttemptedSubmit}
      />
    </>
  )
}
