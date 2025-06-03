"use client"

import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { FBTForm } from "../_components/FBTForm"

export default function CreateFBTPage() {
  const router = useRouter()
  const { currentStore, createFrequentlyBoughtTogether } = useMainStore()
  const { toast } = useToast()

  const handleSubmit = async (data: {
    name: string
    discountName?: string
    discount?: number
    variantIds: string[]
  }) => {
    const fbtData = {
      ...data,
      storeId: currentStore,
    }

    await createFrequentlyBoughtTogether(fbtData)

    toast({
      title: "Éxito",
      description: "Combo creado correctamente",
    })

    router.push("/fbt")
  }

  const handleCancel = () => {
    router.push("/fbt")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Crear Nuevo Combo</h1>
          <p className="text-muted-foreground mt-1">Crea un nuevo grupo de productos frecuentemente comprados juntos</p>
        </div>
      </div>

      <Separator className="my-6" />

      <FBTForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
