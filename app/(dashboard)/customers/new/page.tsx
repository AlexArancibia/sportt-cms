'use client'

import { useRouter } from 'next/navigation'
import { CustomerForm } from '../_components/CustomerForm'
import { Button } from "@/components/ui/button"

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/customers')
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Customer</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CustomerForm onSuccess={handleSuccess} />
    </div>
  )
}

