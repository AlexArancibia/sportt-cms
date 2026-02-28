"use client"

import { useState, useMemo } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useCardSections, useCardSectionMutations } from "@/hooks/useCardSections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import {
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pencil,
} from "lucide-react"
import { HeaderBar } from "@/components/HeaderBar"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CardSection } from "@/types/card"
import { useStorePermissions, hasPermission } from "@/hooks/auth/useStorePermissions"

const MAX_VISIBLE_PAGES = 5

function getPaginationPages(
  totalPages: number,
  currentPage: number,
  paginate: (n: number) => void
): ReactNode[] {
  if (totalPages <= 0) return []
  let startPage = 1
  let endPage = totalPages
  if (totalPages > MAX_VISIBLE_PAGES) {
    if (currentPage <= 3) endPage = 5
    else if (currentPage >= totalPages - 2) startPage = totalPages - 4
    else {
      startPage = currentPage - 2
      endPage = currentPage + 2
    }
  }
  const pages: ReactNode[] = []
  if (startPage > 1) {
    pages.push(
      <Button key={1} variant={currentPage === 1 ? "default" : "ghost"} size="icon" className="h-7 w-7 rounded-sm" onClick={() => paginate(1)}>1</Button>
    )
    if (startPage > 2) pages.push(<span key="ellipsis-start" className="px-1 text-muted-foreground">...</span>)
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button key={i} variant={currentPage === i ? "default" : "ghost"} size="icon" className="h-7 w-7 rounded-sm" onClick={() => paginate(i)}>{i}</Button>
    )
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push(<span key="ellipsis-end" className="px-1 text-muted-foreground">...</span>)
    pages.push(
      <Button key={totalPages} variant={currentPage === totalPages ? "default" : "ghost"} size="icon" className="h-7 w-7 rounded-sm" onClick={() => paginate(totalPages)}>{totalPages}</Button>
    )
  }
  return pages
}

export default function CardSectionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: storePermissions } = useStorePermissions(currentStoreId)
  const canCreateCard = hasPermission(storePermissions, "cards:create")
  const canUpdateCard = hasPermission(storePermissions, "cards:update")
  const canDeleteCard = hasPermission(storePermissions, "cards:delete")
  const { data: cardSections = [], isLoading, refetch } = useCardSections(currentStoreId)
  const { deleteCardSection } = useCardSectionMutations(currentStoreId)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const SECTIONS_PER_PAGE = 15

  const filteredSections = useMemo(() => {
    if (!currentStoreId) return []
    return cardSections.filter(
      (section) =>
        section.storeId === currentStoreId &&
        (section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          section.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          section.description?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [cardSections, searchTerm, currentStoreId])

  const handleDelete = async (id: string) => {
    setSectionToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!sectionToDelete) return
    try {
      await deleteCardSection.mutateAsync(sectionToDelete)
      toast({
        title: "Éxito",
        description: "Sección eliminada correctamente",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la sección",
      })
    } finally {
      setSectionToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedSections.length === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedSections.length === 0) return
    const count = selectedSections.length
    try {
      for (const sectionId of selectedSections) {
        await deleteCardSection.mutateAsync(sectionId)
      }
      setSelectedSections([])
      toast({
        title: "Éxito",
        description: `${count} secciones eliminadas correctamente`,
      })
    } catch (error) {
      console.error("Error deleting sections:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar las secciones",
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const toggleSectionSelection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const toggleAllSections = () => {
    if (selectedSections.length === currentSections.length) {
      setSelectedSections([])
    } else {
      setSelectedSections(currentSections.map((section) => section.id))
    }
  }

  const indexOfLastSection = currentPage * SECTIONS_PER_PAGE
  const indexOfFirstSection = indexOfLastSection - SECTIONS_PER_PAGE
  const currentSections = filteredSections.slice(indexOfFirstSection, indexOfLastSection)
  const totalPages = Math.ceil(filteredSections.length / SECTIONS_PER_PAGE)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const isMutating = deleteCardSection.isPending

  const renderMobileSectionCard = (section: CardSection, index: number) => (
    <div
      key={section.id}
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            checked={selectedSections.includes(section.id)}
            onCheckedChange={() => toggleSectionSelection(section.id)}
            className="mr-1"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{section.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs text-muted-foreground">{section.layout || "Default"}</div>
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <Badge variant={section.isActive ? "default" : "secondary"} className="text-xs">
                {section.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canUpdateCard ? (
              <DropdownMenuItem onClick={() => router.push(`/cards/${section.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {canDeleteCard ? (
              <DropdownMenuItem onClick={() => handleDelete(section.id)} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="text-muted-foreground">Eliminar</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay secciones</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {!currentStoreId
            ? "Selecciona una tienda."
            : searchTerm
              ? `No hay coincidencias para "${searchTerm}"`
              : "No hay secciones disponibles en esta tienda."}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()} className="w-full text-sm h-9">
            <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Secciones de Tarjetas" jsonData={{ cardSections }} jsonLabel="cardSections" />

      <ScrollArea className="h-[calc(100vh-5.5rem)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Secciones de Tarjetas</h3>
                {canCreateCard ? (
                  <>
                    <Button
                      onClick={() => router.push("/cards/new")}
                      size="icon"
                      className="sm:hidden h-9 w-9 create-button"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button onClick={() => router.push("/cards/new")} className="hidden sm:flex create-button">
                      <Plus className="h-4 w-4 mr-2" /> Crear Sección
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      className="sm:hidden h-9 w-9 bg-muted text-muted-foreground cursor-not-allowed"
                      disabled
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button
                      className="hidden sm:flex bg-muted text-muted-foreground cursor-not-allowed"
                      disabled
                    >
                      <Plus className="h-4 w-4 mr-2" /> Crear Sección
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="box-section justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar secciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {selectedSections.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={!canDeleteCard}
                  className={canDeleteCard ? "w-full sm:w-auto hidden sm:flex" : "w-full sm:w-auto hidden sm:flex opacity-60 cursor-not-allowed"}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedSections.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex flex-col w-full p-6 space-y-4">
                  <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                    <div>
                      <p className="font-medium text-sky-700 dark:text-sky-400">Cargando secciones</p>
                      <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
                    </div>
                  </div>

                  <div className="sm:hidden space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="border-b py-3 px-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                            <div>
                              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center w-full p-3 border rounded-md animate-pulse">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[100px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[120px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="ml-auto h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="w-full">
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox disabled />
                            </TableHead>
                            <TableHead className="w-[300px]">Título</TableHead>
                            <TableHead className="w-[150px]">Diseño</TableHead>
                            <TableHead className="w-[120px]">Tarjetas</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="w-[150px]">Actualizado</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>
                  </div>

                  <div className="sm:hidden">{renderMobileEmptyState()}</div>

                  <div className="hidden sm:flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No hay secciones encontradas</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {!currentStoreId
                        ? "Selecciona una tienda."
                        : searchTerm
                          ? `No hay secciones que coincidan con los filtros aplicados "${searchTerm}".`
                          : "No hay secciones disponibles en esta tienda."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {searchTerm && (
                        <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                          Limpiar filtros
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => refetch()} className="w-full sm:w-auto">
                        <svg
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Actualizar datos
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox
                                checked={
                                  selectedSections.length === currentSections.length && currentSections.length > 0
                                }
                                onCheckedChange={toggleAllSections}
                              />
                            </TableHead>
                            <TableHead className="w-[300px]">Título</TableHead>
                            <TableHead className="w-[150px]">Diseño</TableHead>
                            <TableHead className="w-[120px]">Tarjetas</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="w-[150px]">Actualizado</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentSections.map((section, index) => (
                            <TableRow
                              key={section.id}
                              className="transition-all hover:bg-gray-50 dark:hover:bg-gray-900/30"
                              style={{
                                animationDelay: `${index * 50}ms`,
                                animation: "fadeIn 0.3s ease-in-out forwards",
                              }}
                            >
                              <TableCell className="pl-6">
                                <Checkbox
                                  checked={selectedSections.includes(section.id)}
                                  onCheckedChange={() => toggleSectionSelection(section.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium truncate">{section.title}</span>
                                  {section.subtitle && (
                                    <span className="text-xs text-muted-foreground truncate">{section.subtitle}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {section.layout || "Default"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>{section.cards?.length || 0}</span>
                                  {section.maxCards && (
                                    <span className="text-muted-foreground text-xs ml-1">/ {section.maxCards}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={section.isActive ? "default" : "secondary"} className="capitalize">
                                  {section.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {section.updatedAt && (
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(section.updatedAt).toLocaleString()}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {canUpdateCard ? (
                                      <DropdownMenuItem onClick={() => router.push(`/cards/${section.id}/edit`)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                    )}
                                    {canDeleteCard ? (
                                      <DropdownMenuItem onClick={() => handleDelete(section.id)}>
                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                        <span className="text-red-500">Eliminar</span>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span className="text-muted-foreground">Eliminar</span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="sm:hidden w-full">
                    {selectedSections.length > 0 && (
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedSections.length === currentSections.length && currentSections.length > 0}
                            onCheckedChange={toggleAllSections}
                            className="mr-2"
                          />
                          <span className="text-xs font-medium">{selectedSections.length} seleccionados</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          disabled={!canDeleteCard}
                          className={canDeleteCard ? "h-7 text-xs" : "h-7 text-xs opacity-60 cursor-not-allowed"}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}

                    {!selectedSections.length && (
                      <div className="flex items-center py-2 border-b px-2">
                        <Checkbox
                          checked={selectedSections.length === currentSections.length && currentSections.length > 0}
                          onCheckedChange={toggleAllSections}
                          className="mr-2"
                        />
                        <span className="text-xs font-medium">Seleccionar todos</span>
                      </div>
                    )}

                    {currentSections.map((section, index) => renderMobileSectionCard(section, index))}
                  </div>
                </>
              )}
            </div>

            {filteredSections.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstSection + 1} a {Math.min(indexOfLastSection, filteredSections.length)} de{" "}
                  {filteredSections.length} secciones
                </div>
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                  <nav className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>

                    <div className="hidden xs:flex">
                      {getPaginationPages(totalPages, currentPage, paginate)}
                    </div>
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium">
                      <span>{currentPage} / {totalPages || 1}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={indexOfLastSection >= filteredSections.length}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Página siguiente</span>
                    </Button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la sección y todas sus tarjetas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isMutating} className="bg-red-500 hover:bg-red-600">
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedSections.length} secciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente las secciones seleccionadas y todas sus
              tarjetas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} disabled={isMutating} className="bg-red-500 hover:bg-red-600">
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Todas"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
