"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Trash2,
  Edit,
  Package,
  ShoppingBag,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Percent,
} from "lucide-react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { HeaderBar } from "@/components/HeaderBar"
import { FrequentlyBoughtTogether } from "@/types/fbt"

export default function FrequentlyBoughtTogetherPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStore, fetchFrequentlyBoughtTogetherByStore, deleteFrequentlyBoughtTogether } = useMainStore()
  const [fbtItems, setFbtItems] = useState<FrequentlyBoughtTogether[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sistema de fetching mejorado
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 3 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadFbtItems = async (forceRefresh = false) => {
    // Skip fetching if no store is selected
    if (!currentStore) {
      console.log("No hay tienda seleccionada, omitiendo la carga de combos")
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
      console.log(`Cargando combos para la tienda: ${currentStore} (intento ${fetchAttempts + 1})`)
      const data = await fetchFrequentlyBoughtTogetherByStore(currentStore)
      setFbtItems(data)

      // Restablecer los contadores de reintento
      setFetchAttempts(0)
      setLastFetchTime(Date.now())
    } catch (error) {
      console.error("Error al cargar combos:", error)

      // Implementar reintento con backoff exponencial
      if (fetchAttempts < MAX_RETRIES) {
        const nextAttempt = fetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Backoff exponencial

        console.log(`Reintentando carga en ${delay}ms (intento ${nextAttempt}/${MAX_RETRIES})`)

        setFetchAttempts(nextAttempt)
        fetchTimeoutRef.current = setTimeout(() => {
          loadFbtItems(true)
        }, delay)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los combos después de varios intentos. Inténtalo de nuevo.",
        })
        setFetchAttempts(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Usar un debounce para el término de búsqueda
    const debounceTimeout = setTimeout(
      () => {
        loadFbtItems()
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
  }, [searchTerm, currentStore])

  // Filtrar los elementos según el término de búsqueda
  const filteredItems = fbtItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.discountName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setIsSubmitting(true)
    try {
      await deleteFrequentlyBoughtTogether(itemToDelete)
      setFbtItems(fbtItems.filter((item) => item.id !== itemToDelete))
      toast({
        variant: "default",
        title: "Éxito",
        description: "Combo eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting FBT item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el combo",
      })
    } finally {
      setIsSubmitting(false)
      setItemToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteSelected = async () => {
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return

    setIsSubmitting(true)
    try {
      for (const id of selectedItems) {
        await deleteFrequentlyBoughtTogether(id)
      }

      setFbtItems(fbtItems.filter((item) => !selectedItems.includes(item.id)))
      setSelectedItems([])

      toast({
        variant: "default",
        title: "Éxito",
        description: `${selectedItems.length} combos eliminados correctamente`,
      })
    } catch (error) {
      console.error("Error deleting FBT items:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron eliminar algunos combos. Inténtalo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const toggleAllItems = () => {
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(currentItems.map((item) => item.id))
    }
  }

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Componentes de renderizado
  const FbtItemSkeleton = () => (
    <TableRow>
      <TableCell className="w-[40px]">
        <Skeleton className="h-4 w-4" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[80px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-[80px]" />
      </TableCell>
    </TableRow>
  )

  // Renderizado de tarjetas para móvil
  const renderMobileFbtCard = (item: FrequentlyBoughtTogether, index: number) => (
    <div
      key={item.id}
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onCheckedChange={() => toggleItemSelection(item.id)}
            className="mr-1"
          />
          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
            {item.discountName && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.discountName}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {item.discount && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                >
                  <Percent className="h-3 w-3 mr-1" />
                  {item.discount}%
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {item.variants?.length || 0}
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
            <DropdownMenuItem asChild>
              <Link href={`/fbt/${item.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <ShoppingBag className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay combos</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {!currentStore
            ? "No hay combos para esta tienda."
            : searchTerm
              ? `No hay coincidencias para "${searchTerm}"`
              : "No hay combos disponibles en esta tienda."}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (currentStore) {
                loadFbtItems(true) // forzar refresco
              }
            }}
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
          {!searchTerm && currentStore && (
            <Link href="/fbt/new">
              <Button className="w-full text-sm h-9 create-button">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Crear Combo
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  // Renderizar fila de combo para escritorio
  const renderDesktopFbtRow = (item: FrequentlyBoughtTogether, index: number) => (
    <TableRow
      key={item.id}
      className="transition-all hover:bg-gray-50 dark:hover:bg-gray-900/30"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeIn 0.3s ease-in-out forwards",
      }}
    >
      <TableCell className="pl-6">
        <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => toggleItemSelection(item.id)} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center">
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <p className="truncate max-w-[200px] md:max-w-[340px]">{item.name}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="truncate max-w-[150px]">{item.discountName || "-"}</span>
      </TableCell>
      <TableCell>
        {item.discount ? (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            {item.discount}%
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          <Package className="mr-1 h-3 w-3" />
          {item.variants?.length || 0} productos
        </Badge>
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
              <Link href={`/fbt/${item.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  // Renderizar paginación
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
    const maxVisiblePages = 5
    let startPage = 1
    let endPage = totalPages

    if (totalPages > maxVisiblePages) {
      if (currentPage <= 3) {
        endPage = 5
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4
      } else {
        startPage = currentPage - 2
        endPage = currentPage + 2
      }
    }

    const pages = []

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

      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-1 text-muted-foreground">
            ...
          </span>,
        )
      }
    }

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

    if (endPage < totalPages) {
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
  }

  // Contenido principal basado en el estado
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col w-full p-6 space-y-4">
          <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
            <div>
              <p className="font-medium text-sky-700 dark:text-sky-400">Cargando combos</p>
              <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
            </div>
          </div>

          {/* Skeleton loader para móvil */}
          <div className="sm:hidden space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b py-3 px-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton loader para desktop */}
          <div className="hidden sm:block">
            <div className="w-full overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] pl-6">
                      <Checkbox disabled />
                    </TableHead>
                    <TableHead className="w-[300px]">Nombre</TableHead>
                    <TableHead className="hidden md:table-cell w-[150px]">Descuento</TableHead>
                    <TableHead className="w-[120px]">Porcentaje</TableHead>
                    <TableHead className="w-[150px]">Productos</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <FbtItemSkeleton key={index} />
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )
    }

    if (filteredItems.length === 0) {
      return (
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
                    <TableHead className="w-[300px]">Nombre</TableHead>
                    <TableHead className="hidden md:table-cell w-[150px]">Descuento</TableHead>
                    <TableHead className="w-[120px]">Porcentaje</TableHead>
                    <TableHead className="w-[150px]">Productos</TableHead>
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
              <ShoppingBag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay combos encontrados</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {!currentStore
                ? "No hay combos para esta tienda."
                : searchTerm
                  ? `No hay combos que coincidan con los filtros aplicados "${searchTerm}".`
                  : "No hay combos disponibles en esta tienda."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                  Limpiar filtros
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStore) {
                    loadFbtItems(true) // forzar refresco
                  }
                }}
                className="w-full sm:w-auto"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              {!searchTerm && currentStore && (
                <Link href="/fbt/new">
                  <Button className="w-full sm:w-auto create-button">
                    <Plus className="h-4 w-4 mr-2" /> Crear Combo
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        {/* Vista de tabla para pantallas medianas y grandes */}
        <div className="hidden sm:block w-full">
          <div className="w-full overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox
                      checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                      onCheckedChange={toggleAllItems}
                    />
                  </TableHead>
                  <TableHead className="w-[300px]">Nombre</TableHead>
                  <TableHead className="hidden md:table-cell w-[150px]">Descuento</TableHead>
                  <TableHead className="w-[120px]">Porcentaje</TableHead>
                  <TableHead className="w-[150px]">Productos</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>{currentItems.map((item, index) => renderDesktopFbtRow(item, index))}</TableBody>
            </Table>
          </div>
        </div>

        {/* Vista de tarjetas para móviles */}
        <div className="sm:hidden w-full">
          {selectedItems.length > 0 && (
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                  onCheckedChange={toggleAllItems}
                  className="mr-2"
                />
                <span className="text-xs font-medium">{selectedItems.length} seleccionados</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="h-7 text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </div>
          )}

          {!selectedItems.length && (
            <div className="flex items-center py-2 border-b px-2">
              <Checkbox
                checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                onCheckedChange={toggleAllItems}
                className="mr-2"
              />
              <span className="text-xs font-medium">Seleccionar todos</span>
            </div>
          )}

          {currentItems.map((item, index) => renderMobileFbtCard(item, index))}
        </div>
      </>
    )
  }

  return (
    <>
      <HeaderBar title="Productos Frecuentemente Comprados Juntos" jsonData={{ fbtItems }} />

      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Combos</h3>
                <Link href="/fbt/new">
                  <Button size="icon" className="sm:hidden h-9 w-9 create-button">
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button className="hidden sm:flex create-button">
                    <Plus className="h-4 w-4 mr-2" /> Crear Combo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="box-section justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar combos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {selectedItems.length > 0 && (
                <Button variant="outline" onClick={handleDeleteSelected} className="w-full sm:w-auto hidden sm:flex">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar ({selectedItems.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">{renderContent()}</div>

            {filteredItems.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredItems.length)} de{" "}
                  {filteredItems.length} combos
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
                    <div className="hidden xs:flex">{renderPagination()}</div>

                    {/* Indicador de página actual para pantallas pequeñas */}
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium">
                      <span>
                        {currentPage} / {Math.ceil(filteredItems.length / itemsPerPage)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={indexOfLastItem >= filteredItems.length}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Página siguiente</span>
                    </Button>
                  </nav>
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el combo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
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

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar {selectedItems.length} combos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente los combos seleccionados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmBulkDelete}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar Todos"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </ScrollArea>
 
    </>
  )
}
