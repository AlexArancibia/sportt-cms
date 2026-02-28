"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useShippingMethods } from "@/hooks/useShippingMethods"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useShippingMethodMutations } from "@/hooks/settings/useShippingMethodMutations"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import { CreateShippingMethodDto } from "@/types/shippingMethod"
import { ShippingMethodForm } from "@/components/ShippingMethodForm"
import { useStorePermissions, hasPermission } from "@/hooks/auth/useStorePermissions"
import { NoPermissionScreen } from "@/components/NoPermissionScreen"

const PAGE_CLASS = "h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground flex items-center justify-center"

export default function EditShippingMethodPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: storePermissions } = useStorePermissions(currentStoreId)
  const canUpdateShipping = hasPermission(storePermissions, "shippingSettings:update")
  const { data: shopSettings, isLoading: loadingShop } = useShopSettings(currentStoreId)
  const { data: methods = [], isLoading: loadingMethods } = useShippingMethods(
    currentStoreId,
    !!currentStoreId && !!id
  )
  const { updateShippingMethod, isUpdating } = useShippingMethodMutations(currentStoreId)

  const method = methods.find((m) => m.id === id)
  const isLoading = loadingShop || loadingMethods

  useEffect(() => {
    if (isLoading || !id || method) return
    toast({
      variant: "destructive",
      title: "❌ Método no encontrado",
      description: "El método de envío que intentas editar no existe",
    })
    router.replace("/settings")
  }, [isLoading, id, method, toast, router])

  const handleSubmit = async (data: CreateShippingMethodDto) => {
    if (!currentStoreId || !id) return
    try {
      await updateShippingMethod(id, data)
      toast({
        title: "✅ Método actualizado",
        description: "El método de envío ha sido modificado correctamente",
      })
      router.push("/settings")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: getApiErrorMessage(err, "No se pudo actualizar el método de envío."),
      })
    }
  }

  if (!currentStoreId) {
    return (
      <div className={PAGE_CLASS}>
        <p className="text-muted-foreground">
          Selecciona una tienda para editar un método de envío.
        </p>
      </div>
    )
  }

  if (!canUpdateShipping) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <NoPermissionScreen
          title="No tienes acceso para editar métodos de envío"
          message="No tienes permiso para editar métodos de envío. Si crees que deberías tener acceso, contacta al administrador de la tienda."
          backHref="/settings"
        />
      </div>
    )
  }

  if (isLoading || !shopSettings) {
    return (
      <div className={`${PAGE_CLASS} flex-col gap-3`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando método de envío...</p>
      </div>
    )
  }

  if (!method) return null

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Editar {method.name}</h1>
          <p className="text-muted-foreground">Modifica los detalles de este método de envío</p>
        </div>
        <ShippingMethodForm
          shopSettings={shopSettings}
          initialData={method}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
        />
      </div>
    </div>
  )
}
