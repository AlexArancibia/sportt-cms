"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useOrders } from "@/hooks/useOrders"
import { useOrderMutations } from "@/hooks/useOrderMutations"
import { formatCurrency } from "@/lib/utils"
import type { Order } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Pencil, Search, Trash2, ChevronLeft, ChevronRight, Loader2, Plus, FileDown, Check, DollarSign, Package, CreditCard, Truck, Calendar, Filter, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { translateEnum } from "@/lib/translations"
import {
  OrderFinancialStatus,
  OrderFulfillmentStatus,
  PaymentStatus,
  ShippingStatus,
} from "@/types/common"
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
import { DatePicker } from "@/components/ui/date-picker"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

const SEARCH_DEBOUNCE_MS = 300

// Opciones de filtros derivadas de enums + traducciones (fuente única: types/common + lib/translations)
const FINANCIAL_STATUS_OPTIONS = Object.values(OrderFinancialStatus).map((value) => ({
  value,
  label: translateEnum(value),
}))
const FULFILLMENT_STATUS_OPTIONS = Object.values(OrderFulfillmentStatus).map((value) => ({
  value,
  label: translateEnum(value),
}))
const PAYMENT_STATUS_OPTIONS = Object.values(PaymentStatus).map((value) => ({
  value,
  label: translateEnum(value),
}))
const SHIPPING_STATUS_OPTIONS = Object.values(ShippingStatus).map((value) => ({
  value,
  label: translateEnum(value),
}))

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
  const searchParams = useSearchParams()
  
  // Leer parámetros de URL
  const pageFromUrl = searchParams.get('page')
  const queryFromUrl = searchParams.get('q')
  const financialStatusFromUrl = searchParams.get('financialStatus') || ''
  const fulfillmentStatusFromUrl = searchParams.get('fulfillmentStatus') || ''
  const paymentStatusFromUrl = searchParams.get('paymentStatus') || ''
  const shippingStatusFromUrl = searchParams.get('shippingStatus') || ''
  const startDateFromUrl = searchParams.get('startDate')
  const endDateFromUrl = searchParams.get('endDate')
  
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { deleteOrder } = useOrderMutations(currentStoreId)
  const isSingleDeletePending = deleteOrder.isPending

  // CSV Export hook
  const { 
    isDialogOpen: isCSVDialogOpen, 
    isExporting: isCSVExporting, 
    openDialog: openCSVDialog, 
    closeDialog: closeCSVDialog, 
    handleExport: handleCSVExport 
  } = useOrderCSVExport()
  
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(queryFromUrl || "")
  const searchQuery = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS, { instantWhenFalsy: true })
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(pageFromUrl ? parseInt(pageFromUrl) : 1)
  const [pageInput, setPageInput] = useState("")
  
  // Estados de filtros avanzados
  const [financialStatus, setFinancialStatus] = useState(financialStatusFromUrl)
  const [fulfillmentStatus, setFulfillmentStatus] = useState(fulfillmentStatusFromUrl)
  const [paymentStatus, setPaymentStatus] = useState(paymentStatusFromUrl)
  const [shippingStatus, setShippingStatus] = useState(shippingStatusFromUrl)
  const [startDate, setStartDate] = useState<Date | undefined>(startDateFromUrl ? new Date(startDateFromUrl) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(endDateFromUrl ? new Date(endDateFromUrl) : undefined)

  const ordersQueryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ORDERS_PER_PAGE,
      query: searchQuery?.trim() || undefined,
      financialStatus: financialStatus || undefined,
      fulfillmentStatus: fulfillmentStatus || undefined,
      paymentStatus: paymentStatus || undefined,
      shippingStatus: shippingStatus || undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    }),
    [currentPage, searchQuery, financialStatus, fulfillmentStatus, paymentStatus, shippingStatus, startDate, endDate]
  )
  
  const { data: ordersResponse, isLoading, error: queryError, refetch } = useOrders(
    currentStoreId,
    ordersQueryParams,
    !!currentStoreId
  )
  
  const orders = ordersResponse?.data ?? []
  const meta = ordersResponse?.meta
  const pagination: PaginationMeta = useMemo(
    () => ({
      page: meta?.page ?? 1,
      limit: meta?.limit ?? ORDERS_PER_PAGE,
      total: meta?.total ?? 0,
      totalPages: meta?.totalPages ?? 1,
      hasNext: meta?.hasNext ?? meta?.hasNextPage ?? false,
      hasPrev: meta?.hasPrev ?? meta?.hasPrevPage ?? false,
    }),
    [meta]
  )
  
  useEffect(() => {
    if (queryError) {
      setError("No se pudieron cargar los pedidos. Por favor, intente de nuevo.")
    } else {
      setError(null)
    }
  }, [queryError])
  
  useEffect(() => {
    if (!currentStoreId) {
      setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
    } else {
      setError(null)
    }
  }, [currentStoreId])
  
  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || financialStatus || fulfillmentStatus || paymentStatus || shippingStatus || startDate || endDate
  
  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setFinancialStatus("")
    setFulfillmentStatus("")
    setPaymentStatus("")
    setShippingStatus("")
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
  }, [])

  // Reset a página 1 cuando cambian los filtros o la búsqueda (cuando el debounce se resuelve)
  const prevFiltersRef = useRef({
    searchQuery,
    financialStatus,
    fulfillmentStatus,
    paymentStatus,
    shippingStatus,
    startDate,
    endDate,
  })
  useEffect(() => {
    const prev = prevFiltersRef.current
    const changed =
      prev.searchQuery !== searchQuery ||
      prev.financialStatus !== financialStatus ||
      prev.fulfillmentStatus !== fulfillmentStatus ||
      prev.paymentStatus !== paymentStatus ||
      prev.shippingStatus !== shippingStatus ||
      prev.startDate !== startDate ||
      prev.endDate !== endDate
    if (changed) {
      prevFiltersRef.current = {
        searchQuery,
        financialStatus,
        fulfillmentStatus,
        paymentStatus,
        shippingStatus,
        startDate,
        endDate,
      }
      setCurrentPage(1)
    }
  }, [searchQuery, financialStatus, fulfillmentStatus, paymentStatus, shippingStatus, startDate, endDate])

  // Sincronizar el input de página con la página actual
  useEffect(() => {
    setPageInput(currentPage.toString())
  }, [currentPage])

  // Sincronizar URL con filtros (searchQuery es debounced → evita navegación en cada tecla)
  useEffect(() => {
    const params = new URLSearchParams()
    if (currentPage > 1) params.set('page', currentPage.toString())
    if (searchQuery) params.set('q', searchQuery)
    if (financialStatus) params.set('financialStatus', financialStatus)
    if (fulfillmentStatus) params.set('fulfillmentStatus', fulfillmentStatus)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)
    if (shippingStatus) params.set('shippingStatus', shippingStatus)
    if (startDate) params.set('startDate', startDate.toISOString().split('T')[0])
    if (endDate) params.set('endDate', endDate.toISOString().split('T')[0])
    const queryString = params.toString()
    const newUrl = queryString ? `/orders?${queryString}` : '/orders'
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [currentPage, searchQuery, financialStatus, fulfillmentStatus, paymentStatus, shippingStatus, startDate, endDate, router])

  const allVisibleSelected = useMemo(
    () => orders.length > 0 && orders.every((order) => selectedOrders.includes(order.id)),
    [orders, selectedOrders],
  )

  const indexOfFirstOrder = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
  const indexOfLastOrder = pagination.total > 0 ? Math.min(pagination.page * pagination.limit, pagination.total) : 0

  useEffect(() => {
    setSelectedOrders((prev) => {
      if (!prev.length) return prev
      const visibleIds = new Set(orders.map((order) => order.id))
      return prev.filter((id) => visibleIds.has(id))
    })
  }, [orders])

  const paginate = useCallback((pageNumber: number) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), pagination.totalPages)
    if (nextPage !== currentPage) setCurrentPage(nextPage)
  }, [currentPage, pagination.totalPages])

  const confirmPageNavigation = useCallback(() => {
    const page = parseInt(pageInput)
    if (page >= 1 && page <= pagination.totalPages) {
      paginate(page)
    } else {
      setPageInput(currentPage.toString())
    }
  }, [pageInput, pagination.totalPages, paginate, currentPage])

  const handleDelete = useCallback((id: string) => {
    setOrderToDelete(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!orderToDelete) return
    deleteOrder.mutate(orderToDelete, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Pedido eliminado correctamente" })
        setOrderToDelete(null)
        setIsDeleteDialogOpen(false)
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo eliminar el pedido. Por favor, intente de nuevo.",
          variant: "destructive",
        })
      },
    })
  }, [orderToDelete, deleteOrder, toast])

  const handleDeleteSelected = useCallback(() => {
    setIsBulkDeleteDialogOpen(true)
  }, [])

  const confirmBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) return
    const idsToDelete = [...selectedOrders]
    setIsBulkDeleting(true)
    try {
      await Promise.all(idsToDelete.map((id) => deleteOrder.mutateAsync(id)))
      setSelectedOrders([])
      setIsBulkDeleteDialogOpen(false)
      toast({ title: "Éxito", description: `${idsToDelete.length} pedidos eliminados correctamente` })
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron eliminar algunos pedidos. Por favor, intente de nuevo.",
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedOrders, deleteOrder, toast])

  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }, [])

  const toggleAllOrders = useCallback(() => {
    setSelectedOrders(allVisibleSelected ? [] : orders.map((order) => order.id))
  }, [allVisibleSelected, orders])

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
            (currentStoreId
              ? hasActiveFilters
                ? "No hay pedidos que coincidan con los filtros aplicados."
                : "No hay pedidos disponibles."
              : "Por favor, seleccione una tienda para ver sus pedidos.")}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          {currentStoreId && (
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

            {/* Barra de búsqueda y filtros */}
            <div className="box-section flex-col gap-4">
              {/* Primera fila: Búsqueda y filtros */}
              <div className="flex flex-col gap-3 w-full">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pedidos por número, cliente, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Contenedor de filtros */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filtro de Estado Financiero */}
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={financialStatus}
                      onValueChange={(value) => setFinancialStatus(value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="w-auto min-w-[140px] text-foreground pl-8">
                        <SelectValue placeholder="Estado Financiero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {FINANCIAL_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Estado de Cumplimiento */}
                  <div className="relative">
                    <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={fulfillmentStatus}
                      onValueChange={(value) => setFulfillmentStatus(value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="w-auto min-w-[140px] text-foreground pl-8">
                        <SelectValue placeholder="Cumplimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Estado de Pago */}
                  <div className="relative">
                    <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={paymentStatus}
                      onValueChange={(value) => setPaymentStatus(value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="w-auto min-w-[140px] text-foreground pl-8">
                        <SelectValue placeholder="Pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {PAYMENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Estado de Envío */}
                  <div className="relative">
                    <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                    <Select
                      value={shippingStatus}
                      onValueChange={(value) => setShippingStatus(value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="w-auto min-w-[140px] text-foreground pl-8">
                        <SelectValue placeholder="Envío" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {SHIPPING_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Segunda fila: Filtros de fecha */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Fecha Desde */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Desde:</span>
                    <DatePicker
                      date={startDate}
                      setDate={setStartDate}
                      placeholder="Fecha inicio"
                    />
                  </div>

                  {/* Fecha Hasta */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</span>
                    <DatePicker
                      date={endDate}
                      setDate={setEndDate}
                      placeholder="Fecha fin"
                    />
                  </div>
                </div>
              </div>

              {/* Filtros activos y acciones */}
              {(hasActiveFilters || selectedOrders.length > 0) && (
                <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
                  {/* Filtros activos */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filtros activos:</span>
                      </div>

                      {/* Badge de búsqueda */}
                      {searchTerm && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Search className="h-3 w-3" />
                          <span className="max-w-[200px] truncate">{searchTerm}</span>
                          <button
                            onClick={() => setSearchTerm("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar búsqueda"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Estado Financiero */}
                      {financialStatus && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <DollarSign className="h-3 w-3" />
                          <span>{FINANCIAL_STATUS_OPTIONS.find(o => o.value === financialStatus)?.label}</span>
                          <button
                            onClick={() => setFinancialStatus("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar filtro"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Estado de Cumplimiento */}
                      {fulfillmentStatus && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Package className="h-3 w-3" />
                          <span>{FULFILLMENT_STATUS_OPTIONS.find(o => o.value === fulfillmentStatus)?.label}</span>
                          <button
                            onClick={() => setFulfillmentStatus("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar filtro"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Estado de Pago */}
                      {paymentStatus && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <CreditCard className="h-3 w-3" />
                          <span>{PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus)?.label}</span>
                          <button
                            onClick={() => setPaymentStatus("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar filtro"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Estado de Envío */}
                      {shippingStatus && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Truck className="h-3 w-3" />
                          <span>{SHIPPING_STATUS_OPTIONS.find(o => o.value === shippingStatus)?.label}</span>
                          <button
                            onClick={() => setShippingStatus("")}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar filtro"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Fecha Desde */}
                      {startDate && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Desde: {startDate.toLocaleDateString()}</span>
                          <button
                            onClick={() => setStartDate(undefined)}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar fecha desde"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Badge de Fecha Hasta */}
                      {endDate && (
                        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Hasta: {endDate.toLocaleDateString()}</span>
                          <button
                            onClick={() => setEndDate(undefined)}
                            className="ml-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 p-0.5 transition-colors"
                            type="button"
                            aria-label="Quitar fecha hasta"
                          >
                            <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </Badge>
                      )}

                      {/* Botón para limpiar todos los filtros */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllFilters} 
                        className="h-7 text-xs gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}

                  {/* Acciones de pedidos seleccionados */}
                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <span className="text-sm text-muted-foreground">
                        {selectedOrders.length} pedido{selectedOrders.length > 1 ? 's' : ''} seleccionado{selectedOrders.length > 1 ? 's' : ''}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDeleteSelected} 
                        className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar seleccionados
                      </Button>
                    </div>
                  )}
                </div>
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
              ) : orders.length === 0 ? (
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
                                  (currentStoreId
                                    ? hasActiveFilters
                                      ? "No hay pedidos que coincidan con los filtros aplicados."
                                      : "No hay pedidos disponibles en esta tienda."
                                    : "Por favor, seleccione una tienda para ver sus pedidos.")}
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                {hasActiveFilters && (
                                  <Button
                                    variant="outline"
                                    onClick={clearAllFilters}
                                    className="w-full sm:w-auto"
                                  >
                                    Limpiar filtros
                                  </Button>
                                )}
                                {currentStoreId && (
                                  <Button
                                    variant="outline"
                                    onClick={() => refetch()}
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
                        {orders.map((order: Order) => (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all animate-fadeIn"
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

                    {orders.map((order, index) => renderMobileOrderCard(order, index))}
                  </div>
                </>
              )}
            </div>

            {orders.length > 0 && (
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

                    {/* Input de navegación directa a página */}
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium gap-1">
                      <Input
                        type="text"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            confirmPageNavigation()
                          }
                        }}
                        className="w-12 h-6 text-center text-xs border-0 bg-white dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:border focus:border-primary"
                        disabled={isLoading}
                        placeholder="1"
                      />
                      {pageInput !== currentPage.toString() && pageInput.trim() !== "" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={confirmPageNavigation}
                          disabled={isLoading}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <span>/ {pagination.totalPages}</span>
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

            {/* Delete Confirmation Dialog (single) */}
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={(open) => {
                setIsDeleteDialogOpen(open)
                if (!open) setOrderToDelete(null)
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el pedido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSingleDeletePending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={isSingleDeletePending}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSingleDeletePending ? (
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
                  <AlertDialogCancel disabled={isBulkDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmBulkDelete}
                    disabled={isBulkDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar todos"
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
        onExport={(config) => handleCSVExport(config, searchTerm, { financialStatus, fulfillmentStatus, paymentStatus, shippingStatus, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() })}
        isExporting={isCSVExporting}
        type="orders"
      />

    </div>
  )
}
