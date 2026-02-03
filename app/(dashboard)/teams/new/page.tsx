"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useTeamSectionMutations } from "@/hooks/useTeamSections"
import { TeamsHeader } from "../_components/TeamsHeader"
import { TeamsForm } from "../_components/TeamSectionForm"

export default function NewTeamSection() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { createTeamSection, isCreating } = useTeamSectionMutations(currentStoreId ?? null)
  const [formState, setFormState] = useState<any>(null)
  const isSubmitting = isCreating

  const handleSubmit = async (data: any) => {
    try {
      data.storeId = currentStoreId ?? undefined
      if (!data.storeId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Selecciona una tienda para continuar.",
        })
        return
      }
      await createTeamSection(data)
      toast({
        title: "Éxito",
        description: "Sección de equipo creada correctamente",
      })
      router.push("/teams")
    } catch (error) {
      console.error("Error creating team section:", error)
      toast({
        title: "Error",
        description: "Error al crear la sección de equipo",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col w-full max-w-full overflow-hidden">
      <TeamsHeader
        title="Crear Sección de Equipo"
        subtitle="Configura todos los detalles de tu sección de equipo"
        isSubmitting={isSubmitting}
        onSubmit={() => handleSubmit(formState)}
        jsonData={formState}
      />
      <TeamsForm storeId={currentStoreId ?? null} onSubmit={handleSubmit} isSubmitting={isSubmitting} onFormChange={setFormState} />
    </div>
  )
}
