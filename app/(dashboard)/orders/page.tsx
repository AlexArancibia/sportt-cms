"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
import { MoreHorizontal, Pencil, Search, Trash2, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
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

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrdersByStore, deleteOrder, currentStore } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

  // Sistema de fetching mejorado
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 3 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadOrders = async (forceRefresh = false) => {
    // Evitar fetches duplicados o muy frecuentes
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Fetch cooldown active, using cached data")
      return
    }

    // Limpiar cualquier timeout pendiente
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!currentStore) {
        setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
        setIsLoading(false)
        return
      }

      console.log(`Fetching orders for store: ${currentStore} (attempt ${fetchAttempts + 1})`)
      await fetchOrdersByStore()

      // Restablecer los contadores de reintento
      setFetchAttempts(0)
      setLastFetchTime(Date.now())
    } catch (error) {
      console.error("Error fetching orders:", error)

      // Implementar reintento con backoff exponencial
      if (fetchAttempts < MAX_RETRIES) {
        const nextAttempt = fetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Backoff exponencial

        console.log(`Retrying fetch in ${delay}ms (attempt ${nextAttempt}/${MAX_RETRIES})`)

        setFetchAttempts(nextAttempt)
        fetchTimeoutRef.current = setTimeout(() => {
          loadOrders(true)
        }, delay)
      } else {
        setError("No se pudieron cargar los pedidos después de varios intentos. Por favor, intente de nuevo.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch orders after multiple attempts. Please try again.",
        })
        setFetchAttempts(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar órdenes al montar el componente o cuando cambia la tienda actual
  useEffect(() => {
    // Usar un debounce para el término de búsqueda
    const debounceTimeout = setTimeout(
      () => {
        loadOrders()
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
  }, [currentStore, searchTerm])

  // Calcular órdenes filtradas en tiempo real
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fulfillmentStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.financialStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.orderNumber).includes(searchTerm),
    )
  }, [orders, searchTerm])

  // Paginación
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Manejar la eliminación de una orden
  const handleDelete = async (id: string) => {
    setOrderToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!orderToDelete) return

    setIsSubmitting(true)
    try {
      await deleteOrder(orderToDelete)
      await loadOrders(true) // forzar refresco
      toast({
        title: "Éxito",
        description: "Pedido eliminado correctamente",
      })
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
  }

  const handleDeleteSelected = async () => {
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedOrders.length === 0) return

    setIsSubmitting(true)
    try {
      for (const id of selectedOrders) {
        await deleteOrder(id)
      }

      setSelectedOrders([])
      await loadOrders(true) // forzar refresco

      toast({
        title: "Éxito",
        description: `${selectedOrders.length} pedidos eliminados correctamente`,
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
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const toggleAllOrders = () => {
    if (selectedOrders.length === currentOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(currentOrders.map((order) => order.id))
    }
  }

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
            <Button variant="outline" onClick={() => loadOrders(true)} className="w-full text-sm h-9">
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
    <>
      <HeaderBar title="Pedidos" jsonData={{ orders }} jsonLabel="orders" />
      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Pedidos</h3>
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
                          <TableHead>Fecha</TableHead>
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
                          <TableHead>Fecha</TableHead>
                          <TableHead className="w-[70px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
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
                                    onClick={() => loadOrders(true)}
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
                            <Checkbox
                              checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                              onCheckedChange={toggleAllOrders}
                            />
                          </TableHead>
                          <TableHead className="pl-6 w-[50px]">#</TableHead>
                          <TableHead className="w-[250px]">Cliente</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Estado de Pago</TableHead>
                          <TableHead>Estado de Envío</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="w-[70px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentOrders.map((order: Order, index) => (
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
                          <Checkbox
                            checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                            onCheckedChange={toggleAllOrders}
                            className="mr-2"
                          />
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
                        <Checkbox
                          checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
                          onCheckedChange={toggleAllOrders}
                          className="mr-2"
                        />
                        <span className="text-xs font-medium">Seleccionar todos</span>
                      </div>
                    )}

                    {currentOrders.map((order, index) => renderMobileOrderCard(order, index))}
                  </div>
                </>
              )}
            </div>

            {filteredOrders.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstOrder + 1} a {Math.min(indexOfLastOrder, filteredOrders.length)} de{" "}
                  {filteredOrders.length} pedidos
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
                        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
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
                        {currentPage} / {Math.ceil(filteredOrders.length / ordersPerPage)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={indexOfLastOrder >= filteredOrders.length}
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
    </>
  )
}
