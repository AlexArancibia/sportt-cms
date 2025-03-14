"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useMainStore } from "@/stores/mainStore"

export default function HeroSectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { heroSections, fetchHeroSections, deleteHeroSection } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetchHeroSections()
      } catch (error) {
        console.error("Error fetching hero sections:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las secciones hero",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchHeroSections, toast])

  const handleDeleteHeroSection = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta sección hero?")) {
      try {
        await deleteHeroSection(id)
        toast({
          title: "Éxito",
          description: "Sección hero eliminada correctamente",
        })
      } catch (error) {
        console.error("Error deleting hero section:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la sección hero",
        })
      }
    }
  }

  const filteredHeroSections = heroSections.filter(
    (heroSection) =>
      heroSection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (heroSection.subtitle && heroSection.subtitle.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <>
      <HeaderBar title="Secciones Hero" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Secciones Hero</h3>
            <Link href="/hero-sections/new">
              <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                <Plus className="h-4 w-4 mr-2" /> Crear Sección Hero
              </Button>
            </Link>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar secciones hero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className="box-section p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-[250px]">Título</TableHead>
                    <TableHead className="w-[250px]">Subtítulo</TableHead>
                    <TableHead className="w-[150px]">Estado</TableHead>
                    <TableHead className="w-[200px]">Fecha de creación</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHeroSections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay secciones hero disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHeroSections.map((heroSection) => (
                      <TableRow key={heroSection.id} className="text-sm">
                        <TableCell className="py-2 pl-6">
                          <span className="texto flex-grow truncate">{heroSection.title}</span>
                        </TableCell>
                        <TableCell className="texto py-2">
                          <span className="texto flex-grow truncate">{heroSection.subtitle || "—"}</span>
                        </TableCell>
                        <TableCell className="texto py-2">
                          <Badge variant={heroSection.isActive ? "success" : "secondary"}>
                            {heroSection.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="texto py-2">
                          {heroSection.createdAt ? new Date(heroSection.createdAt).toLocaleDateString() : "—"}
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
                                <Link href={`/hero-sections/${heroSection.id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteHeroSection(heroSection.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

