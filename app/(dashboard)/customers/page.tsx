"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
 import { HeaderBar } from "@/components/HeaderBar"
import { Plus } from "lucide-react"
import { CustomerTable } from "./_components/CustomerTable"

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
      <HeaderBar title="Customers" />
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customers</h1>
          <Link href="/customers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Customer
            </Button>
          </Link>
        </div>
        {isLoading ? <p>Loading customers...</p> : <CustomerTable customers={customers} />}
      </div>
    </>
  )
}

