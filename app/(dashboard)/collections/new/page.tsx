'use client'

import { useRouter } from 'next/navigation'
import { CollectionForm } from '../_components/CollectionForm'
import { Button } from "@/components/ui/button"
import { HeaderBar } from '@/components/HeaderBar'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function NewCollectionPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/collections')
  }

  return (
  
  <>
  <HeaderBar title='Colecciónes' />
  
    <div className="container-section">
      <div className='content-section box-container'>
      <ScrollArea className="h-[calc(100vh-7.8em)]  ">
      <CollectionForm onSuccess={handleSuccess} />
      </ScrollArea>
      </div>
    </div>
    </>


    
  )
}

