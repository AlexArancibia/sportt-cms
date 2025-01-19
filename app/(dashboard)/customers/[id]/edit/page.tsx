'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { Customer } from '@/types/customer'
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { CustomerForm } from '../../_components/CustomerForm'

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { getCustomerById, fetchCustomers, loading } = useMainStore()
  const [customer, setCustomer] = useState<Customer | undefined>(undefined)

  useEffect(() => {
    const fetchCustomer = async () => {
      await fetchCustomers(); // Fetch all customers first
      const foundCustomer = getCustomerById(id);
      setCustomer(foundCustomer);
    };

    fetchCustomer();
  }, [id, getCustomerById, fetchCustomers]);

  const handleSuccess = () => {
    router.push('/customers')
  }

  if (loading || !customer) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Customer</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CustomerForm customer={customer} onSuccess={handleSuccess} />
    </div>
  )
}

