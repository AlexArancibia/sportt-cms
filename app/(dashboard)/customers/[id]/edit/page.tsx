"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
 import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CustomerForm from "../../_components/CustomerForm"

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { getCustomerById, updateCustomer } = useMainStore()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<any>(null)

  useEffect(() => {
    const fetchCustomer = async () => {
      const fetchedCustomer = await getCustomerById(resolvedParams.id)
      setCustomer(fetchedCustomer)
    }

    fetchCustomer()
  }, [resolvedParams.id, getCustomerById])

  const handleSubmit = async (data: any) => {
    try {
      await updateCustomer(resolvedParams.id, data)
      toast({
        title: "Success",
        description: "Customer updated successfully",
      })
      router.push("/customers")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      })
    }
  }

  if (!customer) {
    return <div>Loading...</div>
  }

  return (
    <>
      <HeaderBar title="Edit Customer" />
      <div className="container mx-auto py-10">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <CustomerForm customer={customer} onSubmit={handleSubmit} />
      </div>
    </>
  )
}

