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

export function OrdersTable() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrders, deleteOrder } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        await fetchOrders()
        console.log(orders)
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Total Price</TableHead>
          <TableHead>Financial Status</TableHead>
          <TableHead>Fulfillment Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length >0 && orders.map((order: Order) => (
          <TableRow key={order.id}>
            <TableCell>{order.orderNumber}</TableCell>
 
            <TableCell>{formatCurrency(order.totalPrice, order.currency.code)}</TableCell>
            <TableCell>
              <Badge variant={order.financialStatus === "PAID" ? "outline" : "destructive"}>{order.financialStatus}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={order.fulfillmentStatus === "FULFILLED" ? "outline" : "destructive"}>
                {order.fulfillmentStatus}
              </Badge>
            </TableCell>
            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Link href={`/orders/${order.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(order.id)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

