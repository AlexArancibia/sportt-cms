'use client'

import { useRouter } from 'next/navigation'
 
import { Button } from "@/components/ui/button"

export default function NewOrderPage() {
  const router = useRouter()

 
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
 
    </div>
  )
}

