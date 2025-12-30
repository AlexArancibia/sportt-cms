"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { useMainStore } from "@/stores/mainStore"
import type { Order } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Pencil, Search, Trash2, ChevronLeft, ChevronRight, Loader2, Plus, FileDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { translateEnum } from "@/lib/translations"
import { Skeleton } from "@/components/ui/skeleton"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExportCSVDialog } from "../products/_components/ExportCSVDialog"
import { useOrderCSVExport } from "./_hooks/useOrderCSVExport"

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const ORDERS_PER_PAGE = 10

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrdersByStore, deleteOrder, currentStore } = useMainStore()
  
  // CSV Export hook
  const { 
    isDialogOpen: isCSVDialogOpen, 
    isExporting: isCSVExporting, 
    openDialog: openCSVDialog, 
    closeDialog: closeCSVDialog, 
    handleExport: handleCSVExport 
  } = useOrderCSVExport()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: ORDERS_PER_PAGE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })

  const loadOrders = useCallback(async (page: number = 1) => {
    if (!currentStore) {
      setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchOrdersByStore(undefined, { page, limit: ORDERS_PER_PAGE })
      
      if (result?.meta) {
        setPagination({
          page: result.meta.page || page,
          limit: result.meta.limit || ORDERS_PER_PAGE,
          total: result.meta.total || 0,
          totalPages: result.meta.totalPages || 1,
          hasNext: result.meta.hasNext || result.meta.hasNextPage || false,
          hasPrev: result.meta.hasPrev || result.meta.hasPrevPage || false,
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("No se pudieron cargar los pedidos. Por favor, intente de nuevo.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentStore, fetchOrdersByStore, toast])

  useEffect(() => {
    loadOrders(currentPage)
  }, [currentStore, currentPage, loadOrders])

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders
    const term = searchTerm.toLowerCase()
    return orders.filter(
      (order) =>
        order.customerInfo?.email?.toLowerCase().includes(term) ||
        order.customerInfo?.name?.toLowerCase().includes(term) ||
        order.fulfillmentStatus?.toLowerCase().includes(term) ||
        order.financialStatus?.toLowerCase().includes(term) ||
        String(order.orderNumber).includes(searchTerm),
    )
  }, [orders, searchTerm])

  const allVisibleSelected = useMemo(
    () => filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrders.includes(order.id)),
    [filteredOrders, selectedOrders],
  )

  const indexOfFirstOrder = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
  const indexOfLastOrder = pagination.total > 0 ? Math.min(pagination.page * pagination.limit, pagination.total) : 0

  useEffect(() => {
    if (searchTerm) setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    setSelectedOrders((prev) => {
      if (!prev.length) return prev
      const visibleIds = new Set(filteredOrders.map((order) => order.id))
      return prev.filter((id) => visibleIds.has(id))
    })
  }, [filteredOrders])

  const paginate = useCallback((pageNumber: number) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), pagination.totalPages)
    if (nextPage !== currentPage) setCurrentPage(nextPage)
  }, [currentPage, pagination.totalPages])


  const handleDelete = useCallback((id: string) => {
    setOrderToDelete(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!orderToDelete) return

    setIsSubmitting(true)
    try {
      await deleteOrder(orderToDelete)
      await loadOrders(currentPage)
      toast({ title: "Éxito", description: "Pedido eliminado correctamente" })
    } catch (error) {
      console.error("Error al eliminar el pedido:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setOrderToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }, [orderToDelete, deleteOrder, loadOrders, currentPage, toast])

  const handleDeleteSelected = useCallback(() => {
    setIsBulkDeleteDialogOpen(true)
  }, [])

  const confirmBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) return

    setIsSubmitting(true)
    const idsToDelete = [...selectedOrders]
    try {
      await Promise.all(idsToDelete.map((id) => deleteOrder(id)))
      setSelectedOrders([])
      await loadOrders(currentPage)
      toast({
        title: "Éxito",
        description: `${idsToDelete.length} pedidos eliminados correctamente`,
      })
    } catch (error) {
      console.error("Error al eliminar pedidos:", error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar algunos pedidos. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }, [selectedOrders, deleteOrder, loadOrders, currentPage, toast])

  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }, [])

  const toggleAllOrders = useCallback(() => {
    setSelectedOrders(allVisibleSelected ? [] : filteredOrders.map((order) => order.id))
  }, [allVisibleSelected, filteredOrders])

  const paginationButtons = useMemo(() => {
    const maxVisiblePages = 5
    const { totalPages: total } = pagination
    let startPage = 1
    let endPage = total

    if (total > maxVisiblePages) {
      if (currentPage <= 3) {
        endPage = maxVisiblePages
      } else if (currentPage >= total - 2) {
        startPage = total - (maxVisiblePages - 1)
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

    if (endPage < total) {
      if (endPage < total - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-1 text-muted-foreground">
            ...
          </span>,
        )
      }
      pages.push(
        <Button
          key={total}
          variant={currentPage === total ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7 rounded-sm"
          onClick={() => paginate(total)}
        >
          {total}
        </Button>,
      )
    }

    return pages
  }, [currentPage, pagination.totalPages, paginate])

  // Renderizar esqueletos de carga
  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell className="w-[40px]">
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell className="pl-6">
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
        </TableRow>
      ))
  }

  // Renderizado de tarjetas para móvil
  const renderMobileOrderCard = (order: Order, index: number) => (
    <div
      key={order.id}
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onClick={() => router.push(`/orders/${order.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            checked={selectedOrders.includes(order.id)}
            onCheckedChange={() => toggleOrderSelection(order.id)}
            className="mr-1"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">#{order.orderNumber}</span>
              <Badge
                variant={
                  (order.financialStatus?.toLowerCase() as
                    | "pending"
                    | "authorized"
                    | "partially_paid"
                    | "paid"
                    | "partially_refunded"
                    | "refunded"
                    | "voided"
                    | "default") || "default"
                }
                className="text-xs"
              >
                {translateEnum(order.financialStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex flex-col">
                <span className="text-sm truncate">{order.customerInfo?.name || "Cliente invitado"}</span>
                {order.customerInfo?.email && (
                  <span className="text-xs text-muted-foreground truncate">{order.customerInfo.email}</span>
                )}
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Creado: {new Date(order.createdAt).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Editado: {new Date(order.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="font-medium text-sm">
                {formatCurrency(order.totalPrice, order.currency?.code || "USD")}
              </span>
            </div>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )

  // Renderizado del estado vacío para móvil
  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay pedidos</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {error ||
            (currentStore
              ? searchTerm
                ? `No hay coincidencias para "${searchTerm}"`
                : "No hay pedidos disponibles."
              : "Por favor, seleccione una tienda para ver sus pedidos.")}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          {currentStore && (
            <Button variant="outline" onClick={() => loadOrders(currentPage)} className="w-full text-sm h-9">
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
          )}
          <Link href="/orders/new">
            <Button className="w-full text-sm h-9 create-button">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Crear Pedido
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Pedidos" jsonData={{ orders }} jsonLabel="orders" />
      <ScrollArea className="h-[calc(100vh-5.5rem)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Pedidos</h3>
                <div className="flex items-center gap-2">
                  {/* Export Button with Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="hidden sm:flex gap-2">
                        <FileDown className="h-4 w-4" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={openCSVDialog}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar a CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Create Order Button */}
                  <Link href="/orders/new">
                    <Button size="icon" className="sm:hidden h-9 w-9 create-button">
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button className="hidden sm:flex create-button">
                      <Plus className="h-4 w-4 mr-2" /> Crear Pedido
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="box-section justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full text-sm"
                />
              </div>

              {selectedOrders.length > 0 && (
                <Button variant="outline" onClick={handleDeleteSelected} className="w-full sm:w-auto hidden sm:flex">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedOrders.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex flex-col w-full p-6 space-y-4">
                  <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                    <div>
                      <p className="font-medium text-sky-700 dark:text-sky-400">Cargando pedidos</p>
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
                            <div className="flex-1">
                              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skeleton loader para desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead className="pl-6 w-[50px]">#</TableHead>
                          <TableHead className="w-[250px]">Cliente</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Estado de Pago</TableHead>
                          <TableHead>Estado de Envío</TableHead>
                          <TableHead>Fecha de Creación</TableHead>
                          <TableHead>Fecha de Edición</TableHead>
                          <TableHead className="w-[70px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{renderSkeletons()}</TableBody>
                    </Table>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px] ">
                            <Checkbox disabled />
                          </TableHead>
                          <TableHead className="pl-6 w-[50px]">#</TableHead>
                          <TableHead className="w-[250px]">Cliente</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Estado de Pago</TableHead>
                          <TableHead>Estado de Envío</TableHead>
                          <TableHead>Fecha de Creación</TableHead>
                          <TableHead>Fecha de Edición</TableHead>
                          <TableHead className="w-[70px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <Search className="h-8 w-8 text-muted-foreground" />
                              <div className="text-lg font-medium">No hay pedidos encontrados</div>
                              <p className="text-sm text-muted-foreground max-w-md">
                                {error ||
                                  (currentStore
                                    ? searchTerm
                                      ? `No hay pedidos que coincidan con los filtros aplicados "${searchTerm}".`
                                      : "No hay pedidos disponibles en esta tienda."
                                    : "Por favor, seleccione una tienda para ver sus pedidos.")}
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                {searchTerm && (
                                  <Button
                                    variant="outline"
                                    onClick={() => setSearchTerm("")}
                                    className="w-full sm:w-auto"
                                  >
                                    Limpiar filtros
                                  </Button>
                                )}
                                {currentStore && (
                                  <Button
                                    variant="outline"
                                    onClick={() => loadOrders(currentPage)}
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
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vista móvil para pantallas pequeñas */}
                  <div className="sm:hidden">{renderMobileEmptyState()}</div>
                </div>
              ) : (
                <>
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px] pl-6">
                            <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllOrders} />
                          </TableHead>
                          <TableHead className="pl-6 w-[50px]">#</TableHead>
                          <TableHead className="w-[250px]">Cliente</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Estado de Pago</TableHead>
                          <TableHead>Estado de Envío</TableHead>
                          <TableHead>Fecha de Creación</TableHead>
                          <TableHead>Fecha de Edición</TableHead>
                          <TableHead className="w-[70px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: Order, index) => (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all"
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animation: "fadeIn 0.3s ease-in-out forwards",
                            }}
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()} className="pl-6">
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => toggleOrderSelection(order.id)}
                              />
                            </TableCell>
                            <TableCell className="pl-6 font-medium">{order.orderNumber}</TableCell>
                            <TableCell className="w-[250px]">
                              <div className="flex flex-col">
                                <span className="font-medium truncate">
                                  {order.customerInfo?.name || "Cliente invitado"}
                                </span>
                                {order.customerInfo?.email && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {order.customerInfo.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(order.totalPrice, order.currency?.code || "USD")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (order.financialStatus?.toLowerCase() as
                                    | "pending"
                                    | "authorized"
                                    | "partially_paid"
                                    | "paid"
                                    | "partially_refunded"
                                    | "refunded"
                                    | "voided"
                                    | "default") || "default"
                                }
                              >
                                {translateEnum(order.financialStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (order.fulfillmentStatus?.toLowerCase() as
                                    | "unfulfilled"
                                    | "partially_fulfilled"
                                    | "fulfilled"
                                    | "restocked"
                                    | "pending_fulfillment"
                                    | "open"
                                    | "in_progress"
                                    | "on_hold"
                                    | "scheduled"
                                    | "default") || "default"
                                }
                              >
                                {translateEnum(order.fulfillmentStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                            <TableCell>{new Date(order.updatedAt).toLocaleString()}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/orders/${order.id}`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Ver detalles
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/orders/${order.id}/edit`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(order.id)}
                                    className="flex items-center text-red-500"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
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

                  {/* Vista de tarjetas para móviles */}
                  <div className="sm:hidden w-full">
                    {selectedOrders.length > 0 && (
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
                        <div className="flex items-center">
                          <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllOrders} className="mr-2" />
                          <span className="text-xs font-medium">{selectedOrders.length} seleccionados</span>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="h-7 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}

                    {!selectedOrders.length && (
                      <div className="flex items-center py-2 border-b px-2">
                        <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllOrders} className="mr-2" />
                        <span className="text-xs font-medium">Seleccionar todos</span>
                      </div>
                    )}

                    {filteredOrders.map((order, index) => renderMobileOrderCard(order, index))}
                  </div>
                </>
              )}
            </div>

            {filteredOrders.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstOrder} a {indexOfLastOrder} de {pagination.total} pedidos
                </div>
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                  <nav className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={!pagination.hasPrev || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>

                    {/* Paginación para pantallas medianas y grandes */}
                    <div className="hidden xs:flex">
                      {paginationButtons}
                    </div>

                    {/* Indicador de página actual para pantallas pequeñas */}
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium">
                      <span>
                        {currentPage} / {pagination.totalPages}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={!pagination.hasNext || isLoading}
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
                    Esta acción no se puede deshacer. Se eliminará permanentemente el pedido.
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
                  <AlertDialogTitle>¿Eliminar {selectedOrders.length} pedidos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente los pedidos seleccionados.
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

      {/* CSV Export Dialog */}
      <ExportCSVDialog
        open={isCSVDialogOpen}
        onOpenChange={closeCSVDialog}
        onExport={(config) => handleCSVExport(config, searchTerm)}
        isExporting={isCSVExporting}
        type="orders"
      />

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
