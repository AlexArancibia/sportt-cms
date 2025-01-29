"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { useMainStore } from "@/stores/mainStore"
import  { Order } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

export function OrdersTable() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrders, deleteOrder } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

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
 

  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
 
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
      case "FULFILLED":
      case "DELIVERED":
        return "success"
      case "PENDING":
      case "UNFULFILLED":
      case "READY":
        return "outline"
      case "VOIDED":
      case "RETURNED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="rounded-md border">
          <div className="h-24 animate-pulse bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Fulfillment Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 && orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.orderNumber}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{}</TableCell>
                <TableCell>{formatCurrency(order.totalPrice, order.currency.code)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.financialStatus || "")}>
                    {order.financialStatus || "PENDING"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.fulfillmentStatus || "")}>
                    {order.fulfillmentStatus || "UNFULFILLED"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
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
      </div>

      <div className="flex items-center justify-between">
 
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={indexOfLastOrder >= orders.length}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

