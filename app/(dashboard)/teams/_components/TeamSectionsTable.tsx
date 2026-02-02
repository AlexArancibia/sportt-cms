"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Edit, Eye, MoreHorizontal, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { TeamSection } from "@/types/team"

interface TeamSectionsTableProps {
  teamSections: TeamSection[]
  onDelete: (id: string) => Promise<void>
}

export function TeamSectionsTable({ teamSections, onDelete }: TeamSectionsTableProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isDeleting, setIsDeleting] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await onDelete(id)
      toast({
        title: "Sección eliminada",
        description: "La sección de equipo ha sido eliminada correctamente",
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Título</TableHead>
              <TableHead>Diseño</TableHead>
              <TableHead>Miembros</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay secciones de equipo disponibles.
                </TableCell>
              </TableRow>
            ) : (
              teamSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{section.title}</div>
                      {section.subtitle && <div className="text-sm text-muted-foreground">{section.subtitle}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {section.layout || "Default"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{section.members?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={section.isActive ? "default" : "secondary"} className="capitalize">
                      {section.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{formatDate(section.updatedAt)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/team-sections/${section.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver detalles</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/team-sections/${section.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setSectionToDelete(section.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la sección de equipo y todos sus miembros
              asociados.
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
