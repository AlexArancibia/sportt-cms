"use client"

import { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ContentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const { contents, fetchContents, deleteContent } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetchContents()
      } catch (error) {
        console.error("Error fetching contents:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los contenidos",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchContents, toast])

  const handleDeleteContent = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este contenido?")) {
      try {
        await deleteContent(id)
        toast({
          title: "Éxito",
          description: "Contenido eliminado correctamente",
        })
      } catch (error) {
        console.error("Error deleting content:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el contenido",
        })
      }
    }
  }

  const filteredContents = contents.filter(
    (content) =>
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <HeaderBar title="Contenidos" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Contenidos</h3>
            <Link href="/contents/new">
              <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                <Plus className="h-4 w-4 mr-2" /> Crear Contenido
              </Button>
            </Link>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar contenidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[250px]">Título</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead className="w-[200px]">Fecha de Publicación</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.map((content) => (
                  <TableRow key={content.id} className="text-sm">
                    <TableCell className="py-2 pl-6">
                      <span className="texto flex-grow truncate">{content.title}</span>
                    </TableCell>
                    <TableCell className="texto py-2">{content.type}</TableCell>
                    <TableCell className="texto py-2">
                      <Badge variant={content.published ? "success" : "secondary"}>
                        {content.published ? "Publicado" : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell className="texto py-2">
                      {content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : "No publicado"}
                    </TableCell>
                    <TableCell className="texto py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shadow-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contents/${content.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteContent(content.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  )
}

