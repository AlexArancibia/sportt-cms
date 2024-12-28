'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMainStore } from '@/stores/mainStore'
import { PaymentStatus, FulfillmentStatus } from '@/types/order'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, Search, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'

export default function OrdersPage() {
  const { orders, fetchOrders, deleteOrder } = useMainStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id)
        toast({
          title: "Success",
          description: "Order deleted successfully",
        })
      } catch (error) {
        console.log(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete order",
        })
      }
    }
  }

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} selected orders?`)) {
      try {
        await Promise.all(selectedOrders.map(id => deleteOrder(id)))
        setSelectedOrders([])
        toast({
          title: "Success",
          description: "Selected orders deleted successfully",
        })
      } catch (error) {
        console.log(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete selected orders",
        })
      }
    }
  }

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toString().includes(searchTerm) ||
    order.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Link href="/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </header>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {selectedOrders.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedOrders.length})
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedOrders.length === orders.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOrders(orders.map(o => o.id))
                    } else {
                      setSelectedOrders([])
                    }
                  }}
                />
              </TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Fulfillment Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedOrders([...selectedOrders, order.id])
                      } else {
                        setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.customerId}</TableCell>
                <TableCell>${parseFloat(order.total.toString()).toFixed(2)}</TableCell>
                <TableCell>{PaymentStatus[order.paymentStatus]}</TableCell>
                <TableCell>{FulfillmentStatus[order.fulfillmentStatus]}</TableCell>
                <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/orders/${order.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(order.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

