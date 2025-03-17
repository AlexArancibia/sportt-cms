"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeaderBar } from "@/components/HeaderBar"
import { Plus, Search } from "lucide-react"
import { CustomerTable } from "./_components/CustomerTable"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Customer } from "@/types/customer"

export default function CustomersPage() {
  const { customers, fetchCustomers } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      await fetchCustomers()
      setIsLoading(false)
    }

    loadCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (customers) {
      setFilteredCustomers(
        customers.filter((customer) => {
          const searchLower = searchTerm.toLowerCase()
          return (
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower) ||
            customer.phone?.toLowerCase().includes(searchLower) ||
            `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower)
          )
        }).reverse(),
      )
    }
  }, [customers, searchTerm])

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
                  <Plus className="mr-2 h-4 w-4" /> Añadir Cliente
                </Button>
              </Link>
            </div>

            <div className="box-section justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? "cliente" : "clientes"} encontrados
              </div>
            </div>

            <div className="box-section p-0 ">
              {isLoading ? (
                <p className="p-4">Cargando clientes...</p>
              ) : filteredCustomers.length > 0 ? (
                <CustomerTable customers={filteredCustomers} />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No se encontraron clientes que coincidan con tu búsqueda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

