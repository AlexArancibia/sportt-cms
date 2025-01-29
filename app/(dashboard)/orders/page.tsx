import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
 
import { HeaderBar } from "@/components/HeaderBar"
import { OrdersTable } from "./_components/OrdersTable"

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage your orders",
}

export default function OrdersPage() {
  return (
    <>
      <HeaderBar title="Orders" />
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Link href="/orders/new">
            <Button>Create New Order</Button>
          </Link>
        </div>
        <OrdersTable />
      </div>
    </>
  )
}

