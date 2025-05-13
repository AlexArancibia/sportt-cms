"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Eye, Trash2, CreditCard, Palette, LayoutGrid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import { CardSection } from "@/types/card"
 

interface CardSectionsGridProps {
  cardSections: CardSection[]
}

export function CardSectionsGrid({ cardSections }: CardSectionsGridProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { deleteCardSection } = useMainStore()

  const [isDeleting, setIsDeleting] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteCardSection(id)
      toast({
        title: "Sección eliminada",
        description: "La sección de tarjetas ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar la sección:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al eliminar la sección. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsDeleting(false)
      setSectionToDelete(null)
    }
  }

  return (
    <>
      <div className="p-4">
        {cardSections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No hay secciones de tarjetas disponibles.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{section.title}</h3>
                        {section.subtitle && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{section.subtitle}</p>
                        )}
                      </div>
                      <Badge
                        variant={section.isActive ? "default" : "secondary"}
                        className="capitalize ml-2 flex-shrink-0"
                      >
                        {section.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      {section.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{section.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center text-xs bg-muted text-muted-foreground rounded-md px-2 py-1">
                          <CreditCard className="h-3 w-3 mr-1" />
                          <span>
                            {section.cards?.length || 0} tarjetas
                            {section.maxCards && ` / ${section.maxCards}`}
                          </span>
                        </div>
                        {section.layout && (
                          <div className="flex items-center text-xs bg-muted text-muted-foreground rounded-md px-2 py-1">
                            <LayoutGrid className="h-3 w-3 mr-1" />
                            <span className="capitalize">{section.layout}</span>
                          </div>
                        )}
                        {section.backgroundColor && (
                          <div className="flex items-center text-xs bg-muted text-muted-foreground rounded-md px-2 py-1">
                            <Palette className="h-3 w-3 mr-1" />
                            <span>Personalizado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    {/* <div className="text-xs text-muted-foreground">Actualizado: {formatDate(section.updatedAt)}</div> */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/cards/${section.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalles</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/cards/${section.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setSectionToDelete(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sección de tarjetas y todas sus
              tarjetas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (sectionToDelete) handleDelete(sectionToDelete)
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
