"use client"

import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
 import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CustomerForm from "../_components/CustomerForm"

export default function NewCustomerPage() {
  const router = useRouter()
  const { createCustomer } = useMainStore()
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    try {
      await createCustomer(data)
      toast({
        title: "Success",
        description: "Customer created successfully",
      })
      router.push("/customers")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <HeaderBar title="New Customer" />
      <div className="container mx-auto py-10">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <CustomerForm onSubmit={handleSubmit} />
      </div>
    </>
  )
}

