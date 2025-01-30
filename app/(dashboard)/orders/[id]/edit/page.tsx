"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { formatCurrency } from "@/lib/utils"
import type { Order } from "@/types/order"
import { RefundDialog } from "../../_components/RefunDialog"

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { orders, fetchOrders } = useMainStore()
  const [order, setOrder] = useState<Order | null>(null)
 
  const [isLoading, setIsLoading] = useState(true)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        await fetchOrders()
        const foundOrder = orders.find((o) => o.id === resolvedParams.id)
        if (foundOrder) {
          setOrder(foundOrder)
        } else {
          toast({
            title: "Error",
            description: "Order not found",
            variant: "destructive",
          })
          router.push("/orders")
        }
      } catch (error) {
        console.error("Failed to fetch order:", error)
        toast({
          title: "Error",
          description: "Failed to load order. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrder()
  }, [resolvedParams.id, fetchOrders, orders, router, toast])

  if (isLoading || !order) {
    return <div>Loading...</div>
  }

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Order #{order.orderNumber}</h1>
          <Badge variant={getStatusBadgeVariant(order.financialStatus || "")}>
            {order.financialStatus || "PENDING"}
          </Badge>
          <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsRefundDialogOpen(true)}>
            Issue Refund
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-left pb-2">SKU</th>
                      <th className="text-left pb-2">Quantity</th>
                      <th className="text-right pb-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.title}</td>
                        <td className="py-2">{item.variant?.sku || "N/A"}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price, order.currency.code)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotalPrice, order.currency.code)}</span>
                  </div>
                  {order.shippingMethod && (
                    <div className="flex justify-between">
                      <span>{order.shippingMethod.name}</span>
                      <span>{formatCurrency(order.shippingMethod.price, order.currency.code)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(order.totalTax, order.currency.code)}</span>
                  </div>
                  {order.totalDiscounts > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discounts</span>
                      <span>-{formatCurrency(order.totalDiscounts, order.currency.code)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalPrice, order.currency.code)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* {order.refunds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.refunds.map((refund) => (
                    <div key={refund.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            Refund issued on {new Date(refund.createdAt).toLocaleDateString()}
                          </p>
                          {refund.note && <p className="text-sm text-muted-foreground">{refund.note}</p>}
                        </div>
                        <p className="font-medium">{formatCurrency(refund.amount, order.currency.code)}</p>
                      </div>
                      <div className="space-y-2">
                        {refund.lineItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.orderItem.title} × {item.quantity}
                            </span>
                            <span>{formatCurrency(item.amount, order.currency.code)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )} */}

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(order.paymentStatus || "")}>
                    {order.paymentStatus || "PENDING"}
                  </Badge>
                  <span className="text-muted-foreground">{formatCurrency(order.totalPrice, order.currency.code)}</span>
                </div>
                {order.paymentProvider && (
                  <p className="text-sm text-muted-foreground">
                    Payment processed through {order.paymentProvider.name}
                  </p>
                )}
                {order.paymentDetails && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Details</p>
                    <pre className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(order.paymentDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
 
                  {order.customer && (
                    <Link href="/customers" className="text-sm text-blue-600">
                      View Customer Profile
                    </Link>
                  )}
                </div>
 
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shipping Address</CardTitle>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p>{order.shippingAddress.address1}</p>
                  <p>{order.shippingAddress.city}</p>
                  <p>
                    {order.shippingAddress.province}, {order.shippingAddress.country}
                  </p>
                  <p>{order.shippingAddress.zip}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No shipping address provided</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Billing Address</CardTitle>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {order.billingAddress ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p>{order.billingAddress.address1}</p>
                  <p>{order.billingAddress.city}</p>
                  <p>
                    {order.billingAddress.province}, {order.billingAddress.country}
                  </p>
                  <p>{order.billingAddress.zip}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Same as shipping address</p>
              )}
            </CardContent>
          </Card>

          {order.shippingMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{order.shippingMethod.name}</p>
                    <Badge variant={getStatusBadgeVariant(order.shippingStatus)}>{order.shippingStatus}</Badge>
                  </div>
                  {order.trackingNumber && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Tracking number: {order.trackingNumber}</p>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600"
                        >
                          Track shipment
                        </a>
                      )}
                    </div>
                  )}
                  {order.estimatedDeliveryDate && (
                    <p className="text-sm text-muted-foreground">
                      Estimated delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {order.customerNotes ? (
                <p>{order.customerNotes}</p>
              ) : (
                <p className="text-muted-foreground">No notes from customer</p>
              )}
              {order.internalNotes && (
                <div className="mt-4">
                  <p className="font-medium">Internal Notes</p>
                  <p className="text-sm">{order.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RefundDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        order={order}
        onSuccess={() => {
          setIsRefundDialogOpen(false)
          fetchOrders() // Refresh orders to get updated refund information
        }}
      />
    </div>
  )
}

