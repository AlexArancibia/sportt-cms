"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { TeamSectionForm } from "../../_components/TeamSectionForm"

export default function EditTeamSectionPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchTeamSectionsByStore, teamSections, currentStore, fetchStores, stores, fetchTeamSection } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamSection, setTeamSection] = useState<any>(null)

  const teamSectionId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si no hay tiendas cargadas, cargarlas primero
        if (stores.length === 0) {
          await fetchStores()
        }

        // Si no hay secciones de equipo cargadas o si estamos cambiando de tienda, cargar las secciones
        if (teamSections.length === 0 && currentStore) {
          await fetchTeamSectionsByStore(currentStore)
        }

        // Verificar si la sección existe
        const sectionExists = teamSections.some((section) => section.id === teamSectionId)

        if (!sectionExists) {
          // Si la sección no existe en la tienda actual, intentar cargarla específicamente
          if (currentStore) {
            try {
              const section = await fetchTeamSection(teamSectionId)
              setTeamSection(section)
            } catch (err) {
              setError(`No se encontró la sección de equipo con ID: ${teamSectionId}`)
            }
          } else {
            setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
          }
        } else {
          // Si la sección existe, obtenerla del estado
          const section = teamSections.find((section) => section.id === teamSectionId)
          setTeamSection(section)
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos de la sección. Por favor, inténtelo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [
    teamSectionId,
    currentStore,
    fetchTeamSectionsByStore,
    fetchTeamSection,
    fetchStores,
    teamSections,
    stores.length,
  ])

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
        <Button variant="outline" size="icon" onClick={() => router.push("/team-sections")} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Editar Sección de Equipo
          </h1>
          <p className="text-muted-foreground">
            {currentStore ? `Tienda: ${currentStoreName}` : "Seleccione una tienda"}
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos de la sección...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/team-sections")}>
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
          <TeamSectionForm teamSectionId={teamSectionId} initialData={teamSection} />
        </motion.div>
      )}
    </div>
  )
}
