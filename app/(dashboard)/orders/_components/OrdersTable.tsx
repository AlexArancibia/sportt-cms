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
import { AlertCircle, MoreHorizontal, Pencil, Search, Trash2, RefreshCw, StoreIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { translateEnum } from "@/lib/translations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export function OrdersTable() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrdersByStore, deleteOrder, currentStore, stores } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // Función para refrescar los datos manualmente
  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setRefreshKey((prev) => prev + 1)
  }, [])

  // Cargar órdenes al montar el componente o cuando cambia la tienda actual
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!currentStore) {
          setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
          setIsLoading(false)
          return
        }

        console.log("Cargando pedidos para la tienda:", currentStore)
        await fetchOrdersByStore()
        console.log("Pedidos cargados:", orders.length)
      } catch (error) {
        console.error("Error al cargar los pedidos:", error)
        setError("No se pudieron cargar los pedidos. Por favor, intente de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [currentStore, fetchOrdersByStore, refreshKey])

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

  // Manejar la eliminación de una orden
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este pedido?")) {
      try {
        await deleteOrder(id)
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
      }
    }
  }

  // Renderizar el estado de la tienda
 
  // Renderizar esqueletos de carga
  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
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

  return (
    <>
 

      <div className="flex justify-between items-center my-4 px-6">
        <div className="flex items-center space-x-2">
          <div className="relative max-w-sm ">
            <Search className="absolute top-1/2 left-3 h-4 w-4 text-gray-500 -translate-y-1/2" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 h-9 bg-accent/40"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="flex items-center">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

       
        <Table className="border-t">
          <TableHeader>
            <TableRow>
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
            {isLoading ? (
              renderSkeletons()
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order: Order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="pl-6 font-medium">{order.orderNumber}</TableCell>
                  <TableCell className="w-[250px]">
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{order.customerInfo?.name || "Cliente invitado"}</span>
                      {order.customerInfo?.email && (
                        <span className="text-xs text-muted-foreground truncate">{order.customerInfo.email}</span>
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
                          <MoreHorizontal className="h-5 w-5" />
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
                          className="flex items-center text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <div className="text-lg font-medium">No hay pedidos encontrados</div>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {currentStore
                        ? "No hay pedidos para esta tienda o los filtros aplicados no coinciden con ningún pedido."
                        : "Por favor, seleccione una tienda para ver sus pedidos."}
                    </p>
                    {currentStore && (
                      <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar datos
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
     
    </>
  )
}
