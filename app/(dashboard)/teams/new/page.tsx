"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { TeamsHeader } from "../_components/TeamsHeader"
import { TeamsForm } from "../_components/TeamSectionForm"

export default function NewTeamSection() {
  const router = useRouter()
  const { toast } = useToast()
  const { createTeamSection, currentStore } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState<any>(null)

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      // Ensure storeId is set to currentStore
      data.storeId = currentStore

      // Use the store function to create a new team section
      const teamSection = await createTeamSection(data)

      toast({
        title: "Éxito",
        description: "Sección de equipo creada correctamente",
      })

      // Redirect to the team section list
      router.push("/teams")
    } catch (error) {
      console.error("Error creating team section:", error)
      toast({
        title: "Error",
        description: "Error al crear la sección de equipo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
      <TeamsForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onFormChange={setFormState} />
    </div>
  )
}
