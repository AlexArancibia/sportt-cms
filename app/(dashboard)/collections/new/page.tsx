"use client"

import { useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useToast } from "@/hooks/use-toast"
import { CollectionForm } from "../_components/CollectionForm"
import { Loader2 } from "lucide-react"

export default function NewCollectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()

  const handleSuccess = () => {
    toast({
      title: "Colección creada",
      description: "La colección ha sido creada exitosamente",
    })
    router.push("/collections")
  }

  if (!currentStoreId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Selecciona una tienda para continuar.</p>
      </div>
    )
  }

  return <CollectionForm onSuccess={handleSuccess} />
}
