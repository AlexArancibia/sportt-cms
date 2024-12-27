'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { CollectionForm } from '../../_components/CollectionForm'
import { Collection } from '@/types/collection'
import { Button } from "@/components/ui/button"

export default function EditCollectionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { getCollectionById, fetchCollections } = useMainStore()
  const [collection, setCollection] = useState<Collection | undefined>(undefined)

  useEffect(() => {
    fetchCollections().then(() => {
      const foundCollection = getCollectionById(id)
      if (foundCollection) {
        setCollection(foundCollection)
      } else {
        router.push('/collections')
      }
    })
  }, [id, getCollectionById, fetchCollections, router])

  const handleSuccess = () => {
    router.push('/collections')
  }

  if (!collection) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Collection</h1>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        Back
      </Button>
      <CollectionForm collection={collection} onSuccess={handleSuccess} />
    </div>
  )
}

