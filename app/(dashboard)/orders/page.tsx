import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
 
import { HeaderBar } from "@/components/HeaderBar"
import { OrdersTable } from "./_components/OrdersTable"
import { ScrollArea } from "@/components/ui/scroll-area"

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage your orders",
}

export default function OrdersPage() {
  return (
    <>
      <HeaderBar title="Pedidos" />
      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between">
            <h3  >Pedidos</h3>
            <Link href="/orders/new">
              <Button className="create-button">Crear nuevo pedido</Button>
            </Link>

            </div>

            
          <OrdersTable />
 
          </div>


          

 
        </div>
      </ScrollArea>

 
        
 
    </>
  )
}

