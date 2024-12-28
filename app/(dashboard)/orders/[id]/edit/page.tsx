'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { UpdateOrderDto, PaymentStatus, FulfillmentStatus, Order } from '@/types/order'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { updateOrder, getOrderById } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<UpdateOrderDto>({})
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      const fetchedOrder = await getOrderById(id)
      if (fetchedOrder) {
        setOrder(fetchedOrder)
        setFormData(fetchedOrder)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Order not found",
        })
        router.push('/orders')
      }
    }
    fetchOrder()
  }, [id, getOrderById, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateOrder(id, formData)
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      router.push('/orders')
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order",
      })
    }
  }

  if (!order) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Order #{order.orderNumber}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customerId">Customer ID</Label>
          <Input
            id="customerId"
            name="customerId"
            value={formData.customerId || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="number"
            value={formData.phone || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="shippingMethodId">Shipping Method ID</Label>
          <Input
            id="shippingMethodId"
            name="shippingMethodId"
            value={formData.shippingMethodId || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="subtotal">Subtotal</Label>
          <Input
            id="subtotal"
            name="subtotal"
            type="number"
            value={formData.subtotal || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="total">Total</Label>
          <Input
            id="total"
            name="total"
            type="number"
            value={formData.total || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <Select
            value={formData.paymentStatus}
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value as PaymentStatus }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PaymentStatus).map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fulfillmentStatus">Fulfillment Status</Label>
          <Select
            value={formData.fulfillmentStatus}
            onValueChange={(value) => setFormData(prev => ({ ...prev, fulfillmentStatus: value as FulfillmentStatus }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fulfillment status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FulfillmentStatus).map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Update Order</Button>
      </form>
    </div>
  )
}

