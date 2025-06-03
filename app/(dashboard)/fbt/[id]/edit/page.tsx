"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { FrequentlyBoughtTogether } from "@/types/fbt"
import { FBTForm } from "../../_components/FBTForm"

export default function EditFBTPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { currentStore, fetchFrequentlyBoughtTogetherByStore, updateFrequentlyBoughtTogether } = useMainStore()
  const { toast } = useToast()

  const [fbtItem, setFbtItem] = useState<FrequentlyBoughtTogether | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFBTItem = async () => {
      if (!currentStore) return

      try {
        setIsLoading(true)

        // Cargar todos los combos y encontrar el específico
        const fbtItems = await fetchFrequentlyBoughtTogetherByStore(currentStore)
        const foundFbtItem = fbtItems.find((item) => item.id === resolvedParams.id)

        if (foundFbtItem) {
          setFbtItem(foundFbtItem)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Combo no encontrado",
          })
          router.push("/fbt")
        }
      } catch (error) {
        console.error("Error loading FBT item:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información del combo",
        })
        router.push("/fbt")
      } finally {
        setIsLoading(false)
      }
    }

    loadFBTItem()
  }, [currentStore, fetchFrequentlyBoughtTogetherByStore, resolvedParams.id, router, toast])

  const handleSubmit = async (data: {
    name: string
    discountName?: string
    discount?: number
    variantIds: string[]
  }) => {
    await updateFrequentlyBoughtTogether(resolvedParams.id, data)

    toast({
      title: "Éxito",
      description: "Combo actualizado correctamente",
    })

    router.push("/fbt")
  }

  const handleCancel = () => {
    router.push("/fbt")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <Separator className="my-6" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!fbtItem) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Combo no encontrado</h1>
          <button onClick={() => router.push("/fbt")}>Volver a la lista</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Combo</h1>
          <p className="text-muted-foreground mt-1">Modifica los detalles del combo "{fbtItem.name}"</p>
        </div>
      </div>

      <Separator className="my-6" />

      <FBTForm mode="edit" initialData={fbtItem} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}
