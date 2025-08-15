"use client"

import { useEffect, useState, useRef } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { HeaderBar } from "@/components/HeaderBar"
import type { Content } from "@/types/content"

export default function ContentsPage() {
  const { contents, fetchContents, deleteContent, currentStore } = useMainStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredContents, setFilteredContents] = useState<Content[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedContents, setSelectedContents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const contentsPerPage = 20

  // Constantes para el sistema de fetching
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 3 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sistema de fetching mejorado
  const loadData = async (forceRefresh = false) => {
    // Esperar a que se obtenga el store antes de hacer el fetch
    if (!currentStore) {
      console.log("No store selected, waiting for store to be available")
      return
    }

    // Evitar fetches duplicados o muy frecuentes
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Tiempo de espera activo, usando datos en caché")
      return
    }

    // Limpiar cualquier timeout pendiente
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    setIsLoading(true)

    try {
      console.log(`Cargando contenidos (intento ${fetchAttempts + 1})`)
      await fetchContents()

      // Restablecer los contadores de reintento
      setFetchAttempts(0)
      setLastFetchTime(Date.now())
    } catch (error) {
      console.error("Error al cargar contenidos:", error)

      // Implementar reintento con backoff exponencial simplificado
      if (fetchAttempts < MAX_RETRIES) {
        const nextAttempt = fetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Backoff exponencial

        console.log(`Reintentando carga en ${delay}ms (intento ${nextAttempt}/${MAX_RETRIES})`)

        setFetchAttempts(nextAttempt)
        fetchTimeoutRef.current = setTimeout(() => {
          loadData(true)
        }, delay)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "No se pudieron cargar los contenidos después de varios intentos. Por favor, inténtelo de nuevo.",
        })
        setFetchAttempts(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos cuando se obtiene el store
  useEffect(() => {
    if (currentStore) {
      loadData()
    }
  }, [currentStore])

  // Cargar datos cuando cambia el término de búsqueda
  useEffect(() => {
    // Solo cargar si ya tenemos un store seleccionado
    if (currentStore) {
      // Usar un debounce para el término de búsqueda
      const debounceTimeout = setTimeout(
        () => {
          loadData()
        },
        searchTerm ? 300 : 0,
      ) // Debounce de 300ms solo para búsquedas

      return () => {
        clearTimeout(debounceTimeout)
        // Limpiar cualquier fetch pendiente al desmontar
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }
      }
    }
  }, [searchTerm, currentStore])

  // Actualizar los contenidos filtrados cuando cambian los contenidos, el término de búsqueda o el store
  useEffect(() => {
    // Solo actualizar los contenidos filtrados cuando:
    // 1. No estamos en medio de una carga
    // 2. Tenemos un store seleccionado
    // 3. Cambian los contenidos, el término de búsqueda o el store
    if (!isLoading && currentStore) {
      setFilteredContents(
        contents
          .filter(
            (content) =>
              // Filtrar por store actual
              content.storeId === currentStore &&
              // Filtrar por término de búsqueda
              (content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               content.slug.toLowerCase().includes(searchTerm.toLowerCase())),
          )
          .reverse(),
      )
    } else if (!currentStore) {
      // Si no hay store seleccionado, limpiar los contenidos filtrados
      setFilteredContents([])
    }
  }, [contents, searchTerm, isLoading, currentStore])

  // Función para eliminar un contenido
  const handleDelete = async (contentId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este contenido?")) {
      setIsLoading(true)
      try {
        await deleteContent(contentId)
        // Usar el sistema de fetching mejorado en lugar de llamar directamente
        loadData(true) // forzar refresco
        toast({
          title: "Éxito",
          description: "Contenido eliminado correctamente",
        })
      } catch (error) {
        console.error("Error al eliminar el contenido:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al eliminar el contenido",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Función para eliminar múltiples contenidos
  const handleBulkDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar ${selectedContents.length} contenidos?`)) {
      setIsLoading(true)
      try {
        // Eliminar cada contenido
        for (const contentId of selectedContents) {
          await deleteContent(contentId)
        }

        // Limpiar selección
        setSelectedContents([])

        // Usar el sistema de fetching mejorado
        loadData(true) // forzar refresco

        toast({
          title: "Éxito",
          description: `${selectedContents.length} contenidos eliminados correctamente`,
        })
      } catch (error) {
        console.error("Error al eliminar contenidos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al eliminar los contenidos",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Funciones para selección de contenidos
  const toggleContentSelection = (contentId: string) => {
    setSelectedContents((prev) =>
      prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId],
    )
  }

  const toggleAllContents = () => {
    if (selectedContents.length === currentContents.length) {
      setSelectedContents([])
    } else {
      setSelectedContents(currentContents.map((content) => content.id))
    }
  }

  // Paginación
  const indexOfLastContent = currentPage * contentsPerPage
  const indexOfFirstContent = indexOfLastContent - contentsPerPage
  const currentContents = filteredContents.slice(indexOfFirstContent, indexOfLastContent)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Renderizar el estado de publicación
  const renderPublishStatus = (content: Content) => {
    const isMobile = window.innerWidth < 640

    if (!content.published) {
      return isMobile ? (
        <span className="text-gray-600 dark:text-gray-400">Borrador</span>
      ) : (
        <Badge variant="secondary">Borrador</Badge>
      )
    }

    return isMobile ? (
      <span className="text-emerald-700 dark:text-emerald-500">Publicado</span>
    ) : (
      <Badge variant="success">Publicado</Badge>
    )
  }

  // Renderizar tarjeta de contenido para móvil
  const renderMobileContentCard = (content: Content, index: number) => (
    <div
      key={content.id}
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            checked={selectedContents.includes(content.id)}
            onCheckedChange={() => toggleContentSelection(content.id)}
            className="mr-1"
          />
          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{content.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs text-muted-foreground">{content.type}</div>
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <div className="text-xs">{renderPublishStatus(content)}</div>
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
            <DropdownMenuItem asChild>
              <Link href={`/contents/${content.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(content.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  // Renderizar estado vacío para móvil
  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay contenidos</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {searchTerm ? `No hay coincidencias para "${searchTerm}"` : "No hay contenidos disponibles."}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => loadData(true)} // forzar refresco
            className="w-full text-sm h-9"
          >
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

  // Renderizar fila de contenido para escritorio
  const renderDesktopContentRow = (content: Content, index: number) => (
    <TableRow
      key={content.id}
      className="transition-all hover:bg-gray-50 dark:hover:bg-gray-900/30"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeIn 0.3s ease-in-out forwards",
      }}
    >
      <TableCell className="pl-6">
        <Checkbox
          checked={selectedContents.includes(content.id)}
          onCheckedChange={() => toggleContentSelection(content.id)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
          <p className="truncate max-w-[200px] md:max-w-[340px]">{content.title}</p>
        </div>
      </TableCell>
      <TableCell>{content.type}</TableCell>
      <TableCell>{renderPublishStatus(content)}</TableCell>
      <TableCell className="hidden sm:table-cell">
        {content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : "No publicado"}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/contents/${content.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(content.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      <HeaderBar title="Contenidos" />

      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Contenidos</h3>
                <Link href="/contents/new">
                  <Button size="icon" className="sm:hidden h-9 w-9 create-button">
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button className="hidden sm:flex create-button">
                    <Plus className="h-4 w-4 mr-2" /> Crear Contenido
                  </Button>
                </Link>
              </div>
            </div>

            <div className="box-section justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar contenidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {selectedContents.length > 0 && (
                <Button variant="outline" onClick={handleBulkDelete} className="w-full sm:w-auto hidden sm:flex">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedContents.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex flex-col w-full p-6 space-y-4">
                  <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                    <div>
                      <p className="font-medium text-sky-700 dark:text-sky-400">Cargando contenidos</p>
                      <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
                    </div>
                  </div>

                  {/* Skeleton loader para móvil */}
                  <div className="sm:hidden space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                            <div>
                              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2.5 h-16"></div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2.5 h-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skeleton loader para desktop */}
                  <div className="hidden sm:block space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center w-full p-3 border rounded-md animate-pulse">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-sm mr-4"></div>
                        <div className="h-4 w-[340px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[100px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[100px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="ml-auto h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredContents.length === 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox disabled />
                            </TableHead>
                            <TableHead className="w-[300px]">Título</TableHead>
                            <TableHead className="w-[120px]">Tipo</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="hidden sm:table-cell w-[150px]">Fecha de Publicación</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>
                  </div>

                  {/* Vista móvil para pantallas pequeñas */}
                  <div className="sm:hidden">{renderMobileEmptyState()}</div>

                  <div className="hidden sm:flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No hay contenidos encontrados</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {searchTerm
                        ? `No hay contenidos que coincidan con los filtros aplicados "${searchTerm}".`
                        : "No hay contenidos disponibles."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {searchTerm && (
                        <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                          Limpiar filtros
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => loadData(true)} // forzar refresco
                        className="w-full sm:w-auto"
                      >
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
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px] pl-6">
                              <Checkbox
                                checked={
                                  selectedContents.length === currentContents.length && currentContents.length > 0
                                }
                                onCheckedChange={toggleAllContents}
                              />
                            </TableHead>
                            <TableHead className="w-[300px]">Título</TableHead>
                            <TableHead className="w-[120px]">Tipo</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="hidden sm:table-cell w-[150px]">Fecha de Publicación</TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentContents.map((content, index) => renderDesktopContentRow(content, index))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Vista de tarjetas para móviles */}
                  <div className="sm:hidden w-full">
                    {selectedContents.length > 0 && (
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedContents.length === currentContents.length && currentContents.length > 0}
                            onCheckedChange={toggleAllContents}
                            className="mr-2"
                          />
                          <span className="text-xs font-medium">{selectedContents.length} seleccionados</span>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-7 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}

                    {!selectedContents.length && (
                      <div className="flex items-center py-2 border-b px-2">
                        <Checkbox
                          checked={selectedContents.length === currentContents.length && currentContents.length > 0}
                          onCheckedChange={toggleAllContents}
                          className="mr-2"
                        />
                        <span className="text-xs font-medium">Seleccionar todos</span>
                      </div>
                    )}

                    {currentContents.map((content, index) => renderMobileContentCard(content, index))}
                  </div>
                </>
              )}
            </div>

            {filteredContents.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstContent + 1} a {Math.min(indexOfLastContent, filteredContents.length)} de{" "}
                  {filteredContents.length} contenidos
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

                    {/* Paginación para pantallas medianas y grandes */}
                    <div className="hidden xs:flex">
                      {(() => {
                        const totalPages = Math.ceil(filteredContents.length / contentsPerPage)
                        const maxVisiblePages = 5
                        let startPage = 1
                        let endPage = totalPages

                        if (totalPages > maxVisiblePages) {
                          // Siempre mostrar la primera página
                          const leftSiblingIndex = Math.max(currentPage - 1, 1)
                          // Siempre mostrar la última página
                          const rightSiblingIndex = Math.min(currentPage + 1, totalPages)

                          // Calcular páginas a mostrar
                          if (currentPage <= 3) {
                            // Estamos cerca del inicio
                            endPage = 5
                          } else if (currentPage >= totalPages - 2) {
                            // Estamos cerca del final
                            startPage = totalPages - 4
                          } else {
                            // Estamos en el medio
                            startPage = currentPage - 2
                            endPage = currentPage + 2
                          }
                        }

                        const pages = []

                        // Añadir primera página si no está incluida en el rango
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key="1"
                              variant={currentPage === 1 ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(1)}
                            >
                              1
                            </Button>,
                          )

                          // Añadir elipsis si hay un salto
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="px-1 text-muted-foreground">
                                ...
                              </span>,
                            )
                          }
                        }

                        // Añadir páginas del rango calculado
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(i)}
                            >
                              {i}
                            </Button>,
                          )
                        }

                        // Añadir última página si no está incluida en el rango
                        if (endPage < totalPages) {
                          // Añadir elipsis si hay un salto
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-1 text-muted-foreground">
                                ...
                              </span>,
                            )
                          }

                          pages.push(
                            <Button
                              key={totalPages}
                              variant={currentPage === totalPages ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(totalPages)}
                            >
                              {totalPages}
                            </Button>,
                          )
                        }

                        return pages
                      })()}
                    </div>

                    {/* Indicador de página actual para pantallas pequeñas */}
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium">
                      <span>
                        {currentPage} / {Math.ceil(filteredContents.length / contentsPerPage)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={indexOfLastContent >= filteredContents.length}
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
    </>
  )
}
 