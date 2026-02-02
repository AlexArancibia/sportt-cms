"use client"

import { useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useShippingMethodMutations } from "@/hooks/settings/useShippingMethodMutations"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import { CreateShippingMethodDto } from "@/types/shippingMethod"
import { ShippingMethodForm } from "@/components/ShippingMethodForm"
import { Loader2 } from "lucide-react"

const CENTER_LAYOUT =
  "h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground flex items-center justify-center"

export default function NewShippingMethodPage() {
  const router = useRouter()
  const { currentStoreId } = useStores()
  const { data: shopSettings, isLoading: isLoadingShopSettings } = useShopSettings(currentStoreId)
  const { createShippingMethod, isCreating } = useShippingMethodMutations(currentStoreId)
  const { toast } = useToast()

  const handleSubmit = async (data: CreateShippingMethodDto) => {
    if (!currentStoreId) return
    try {
      await createShippingMethod(data)
      toast({ title: "Método creado", description: "El método de envío ha sido registrado." })
      router.push("/settings")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(error, "No se pudo crear el método de envío. Intenta de nuevo."),
      })
    }
  }

  if (!currentStoreId) {
    return (
      <div className={CENTER_LAYOUT}>
        <p className="text-muted-foreground">Selecciona una tienda para crear un método de envío.</p>
      </div>
    )
  }

  if (isLoadingShopSettings || !shopSettings) {
    return (
      <div className={CENTER_LAYOUT}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <div className="container mx-auto py-8">
        <ShippingMethodForm
          shopSettings={shopSettings}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
        />
      </div>
    </div>
  )
}
