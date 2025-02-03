import type { Metadata } from "next"
 
import { HeaderBar } from "@/components/HeaderBar"
import { OrderForm } from "../_components/OrderForm"
import { ScrollArea } from "@/components/ui/scroll-area"

export const metadata: Metadata = {
  title: "Create New Order",
  description: "Create a new order in the system",
}

export default function NewOrderPage() {
  return (
    <>
 
 
 
        <OrderForm />
 
 
    </>
  )
}

