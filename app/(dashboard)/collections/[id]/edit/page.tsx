"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useCollectionById } from "@/hooks/useCollections"
import { CollectionForm } from "../../_components/CollectionForm"
import { HeaderBar } from "@/components/HeaderBar"
import { Loader2 } from "lucide-react"

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams?.id as string
  const { currentStoreId } = useStores()
  const { data: collection, isLoading, isError } = useCollectionById(
    currentStoreId ?? null,
    id,
    !!currentStoreId && !!id
  )

  useEffect(() => {
    if (!isLoading && (isError || !collection)) {
      router.replace("/collections")
    }
  }, [isLoading, isError, collection, router])

  const handleSuccess = () => {
    router.push("/collections")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando colección...</p>
      </div>
    )
  }

  if (isError || !collection) {
    return null
  }

  return (
    <>
      <HeaderBar title="Colecciones" />
      <div className="container-section">
        <div className="content-section box-container">
          <CollectionForm collection={collection} onSuccess={handleSuccess} />
        </div>
      </div>
    </>
  )
}
