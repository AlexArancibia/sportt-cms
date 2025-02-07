"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { HeaderBar } from "@/components/HeaderBar"
import { Plus } from "lucide-react"
import { CustomerTable } from "./_components/CustomerTable"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CustomersPage() {
  const { customers, fetchCustomers } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      await fetchCustomers()
      setIsLoading(false)
    }

    loadCustomers()
  }, [fetchCustomers])

  return (
    <>
      <HeaderBar title="Clientes" />
      <ScrollArea className="h-[calc(100vh-3.7em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between">
              <h3 className=" ">Clientes</h3>
              <Link href="/customers/new">
                <Button className="create-button">
                  <Plus className="mr-2 h-4 w-4" /> Añadir Nuevo Cliente
                </Button>
              </Link>
            </div>
            <div className="box-section p-0 ">
              {isLoading ? <p>Cargando clientes...</p> : <CustomerTable customers={customers} />}
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

