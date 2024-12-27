'use client'

import { useRouter } from 'next/navigation'
import { CollectionForm } from '../_components/CollectionForm'
import { Button } from "@/components/ui/button"

export default function NewCollectionPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/collections')
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Collection</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CollectionForm onSuccess={handleSuccess} />
    </div>
  )
}

