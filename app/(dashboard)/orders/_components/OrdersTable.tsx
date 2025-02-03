"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { useMainStore } from "@/stores/mainStore"
import type { Order } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { translateEnum } from "@/lib/translations"

export function OrdersTable() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrders, deleteOrder } = useMainStore()
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadOrders = async () => {
      try {
        await fetchOrders()
      } catch (error) {
        console.error("Failed to fetch orders:", error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [fetchOrders, toast])

  useEffect(() => {
    setFilteredOrders(
      orders.filter(
        (order) =>
          order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.fulfillmentStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.financialStatus?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [orders, searchTerm])

  const capitalizeFirstLetter = (text: string) => {
    if (!text) return text; // Si el texto está vacío, lo devuelve tal cual
    const formattedText = text.replace(/_/g, " "); // Reemplaza guiones bajos con espacios
    return formattedText.charAt(0).toUpperCase() + formattedText.slice(1).toLowerCase();
  };
  

  

 

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id)
        toast({
          title: "Success",
          description: "Order deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete order:", error)
        toast({
          title: "Error",
          description: "Failed to delete order. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) return <div>Loading orders...</div>

  return (
    <>
      <div className="box-section justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 text-gray-500 -translate-y-1/2" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 h-8 bg-accent/40"
            />
          </div>
        </div>
      </div>

      <div className="box-section p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[50px]">#</TableHead>
              <TableHead className="w-[250px]">Cliente</TableHead>
              <TableHead>Precio Total</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Fulfillment Status</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="pl-6">{order.orderNumber}</TableCell>
                  <TableCell className="w-[250px] truncate">
                    {order.customer?.firstName + " " + order.customer?.lastName}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalPrice, order.currency.code)}</TableCell>
                  <TableCell>
                  <Badge
                    variant={(order.financialStatus?.toLowerCase() as "pending" | "authorized" | "partially_paid" | "paid" | "partially_refunded" | "refunded" | "voided" | "default") || "default"}
                  >
                    {translateEnum(order.financialStatus)}
                  </Badge>
                  </TableCell>
                  <TableCell>
                  <Badge
                    variant={(order.fulfillmentStatus?.toLowerCase() as 
                      "unfulfilled" | "partially_fulfilled" | "fulfilled" | "restocked" | "pending_fulfillment" | "open" | "in_progress" | "on_hold" | "scheduled" | "default"
                    ) || "default"}
                  >
                    {translateEnum(order.fulfillmentStatus)}
                  </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString()}  </TableCell>
                  <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-5 w-5 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                      <Link href={`/orders/${order.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4 text-primary" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(order.id)} className="flex items-center text-red-600">
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
                <TableCell colSpan={7} className="text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}