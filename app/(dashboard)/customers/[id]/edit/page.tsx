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
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const fetchedCustomer = await getCustomerById(resolvedParams.id)
        if (fetchedCustomer) {
          setCustomer(fetchedCustomer)
        } else {
          toast({
            title: "Error",
            description: "Customer not found",
            variant: "destructive",
          })
          router.push("/customers")
        }
      } catch (error) {
        console.error("Failed to fetch customer:", error)
        toast({
          title: "Error",
          description: "Failed to load customer. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
  }, [resolvedParams.id, getCustomerById, router, toast])

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
