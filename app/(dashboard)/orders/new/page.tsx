import type { Metadata } from "next"
 
import { HeaderBar } from "@/components/HeaderBar"
import { OrderForm } from "../_components/OrderForm"

export const metadata: Metadata = {
  title: "Create New Order",
  description: "Create a new order in the system",
}

export default function NewOrderPage() {
  return (
    <>
      <HeaderBar title="Create New Order" />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Create New Order</h1>
        <OrderForm />
      </div>
    </>
  )
}

