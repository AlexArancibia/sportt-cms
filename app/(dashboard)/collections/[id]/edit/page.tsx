'use client'

import { use, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { CollectionForm } from '../../_components/CollectionForm'
import { Collection } from '@/types/collection'
import { Button } from "@/components/ui/button"
import { HeaderBar } from '@/components/HeaderBar'

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams?.id as string
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
    <>
    <HeaderBar title='Colecciones' />
     
    <div className="container-section">
      <div className='content-section box-container'>
 
      <CollectionForm collection={collection} onSuccess={handleSuccess} />
      </div>
    </div>
    </>
  )
}

