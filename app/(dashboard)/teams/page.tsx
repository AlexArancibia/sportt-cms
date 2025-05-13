"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
 
import { Plus, Grid, List, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TeamSectionsTable } from "./_components/TeamSectionsTable"
import { TeamSectionsGrid } from "./_components/TeamSectionsGrid"

export default function TeamSectionsPage() {
  const router = useRouter()
  const { teamSections, fetchTeamSectionsByStore, currentStore, stores, fetchStores } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"table" | "grid">("table")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si no hay tiendas cargadas, cargarlas primero
        if (stores.length === 0) {
          await fetchStores()
        }

        // Si hay una tienda seleccionada, cargar las secciones de equipo
        if (currentStore) {
          await fetchTeamSectionsByStore(currentStore)
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar las secciones de equipo. Por favor, inténtelo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentStore, fetchTeamSectionsByStore, fetchStores, stores.length])

  const handleRefresh = async () => {
    if (!currentStore) return

    setIsRefreshing(true)
    try {
      await fetchTeamSectionsByStore(currentStore)
    } catch (err) {
      console.error("Error al refrescar datos:", err)
      setError("Error al refrescar las secciones de equipo. Por favor, inténtelo de nuevo.")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Obtener el nombre de la tienda actual para mostrarlo
  const currentStoreName = stores.find((store) => store.id === currentStore)?.name || "Tienda"

  return (
    <div className="container mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Secciones de Equipo
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentStore ? `Tienda: ${currentStoreName}` : "Seleccione una tienda"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/team-sections/new")}
            disabled={!currentStore || isLoading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Sección</span>
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando secciones de equipo...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !currentStore ? (
        <Alert className="mb-6">
          <AlertTitle>No hay tienda seleccionada</AlertTitle>
          <AlertDescription>Seleccione una tienda para ver las secciones de equipo.</AlertDescription>
        </Alert>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <Tabs value={view} onValueChange={(v) => setView(v as "table" | "grid")} className="w-auto">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Tabla</span>
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  <span className="hidden sm:inline">Cuadrícula</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          <div className="bg-card rounded-lg border shadow-sm">
            <TabsContent value="table" className="mt-0">
              <TeamSectionsTable teamSections={teamSections} />
            </TabsContent>
            <TabsContent value="grid" className="mt-0">
              <TeamSectionsGrid teamSections={teamSections} />
            </TabsContent>
          </div>
        </motion.div>
      )}
    </div>
  )
}
