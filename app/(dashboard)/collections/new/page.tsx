"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { CollectionForm } from "../_components/CollectionForm"

export default function NewCollectionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Colección creada",
      description: "La colección ha sido creada exitosamente",
    })
    router.push("/collections")
  }

  return <CollectionForm onSuccess={handleSuccess} />
}
