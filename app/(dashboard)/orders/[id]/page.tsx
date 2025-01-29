import type { Metadata } from "next"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Order Details",
  description: "View and manage order details",
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the order details here
  const order = {
    id: params.id,
    orderNumber: "#20",
    status: "Unconfirmed",
    date: "Dec 29, 2023 4:47 AM",
    customer: {
      email: "steven.walsh@example.com",
      shippingAddress: {
        name: "Steven Walsh",
        address: "40797 Jeffery Crescent Suite 892",
        city: "Mccarthyfort",
        state: "CO",
        country: "United States of America",
        postalCode: "81389",
      },
      billingAddress: "Same as shipping address",
    },
    items: [
      {
        id: "1",
        name: "Grey Hoodie",
        sku: "UHJvZHVjdFZhcmlhbnQ",
        quantity: 1,
        price: 84.0,
        currency: "USD",
      },
      {
        id: "2",
        name: "The Dash Cushion",
        sku: "UHJvZHVjdFZhcmlhbnQ",
        quantity: 3,
        price: 92.41,
        currency: "USD",
      },
    ],
    subtotal: 84.0,
    shipping: {
      method: "UPS",
      cost: 92.41,
    },
    taxes: 0.0,
    total: 176.41,
    currency: "USD",
    paymentStatus: "Fully paid",
    salesChannel: "Default Channel",
    notes: "No notes from customer",
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
          <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
          <Badge variant="secondary">{order.status}</Badge>
          <span className="text-muted-foreground">{order.date}</span>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
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
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2">{item.sku}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price, item.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{order.shipping.method}</span>
                    <span>{formatCurrency(order.shipping.cost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(order.taxes, order.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge  >{order.paymentStatus}</Badge>
                  <span className="text-muted-foreground">{formatCurrency(order.total, order.currency)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Preauthorized amount</span>
                    <span>{formatCurrency(0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Captured amount</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outstanding Balance</span>
                    <Badge variant="outline">Settled</Badge>
                  </div>
                </div>
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
                  <p className="font-medium">{order.customer.email}</p>
                  <Link href="/orders" className="text-sm text-blue-600">
                    View Orders
                  </Link>
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
              <div className="space-y-1">
                <p className="font-medium">{order.customer.shippingAddress.name}</p>
                <p>{order.customer.shippingAddress.address}</p>
                <p>{order.customer.shippingAddress.city}</p>
                <p>
                  {order.customer.shippingAddress.state}, {order.customer.shippingAddress.country}
                </p>
              </div>
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
              <p className="text-muted-foreground">{order.customer.billingAddress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales channel</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="#" className="text-blue-600">
                {order.salesChannel}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{order.notes}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline">Back</Button>
        <Button>Confirm order</Button>
      </div>
    </div>
  )
}

