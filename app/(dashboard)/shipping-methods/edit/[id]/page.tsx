"use client"

import { useMainStore } from "@/stores/mainStore"
import { redirect, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { CreateShippingMethodDto, ShippingMethod } from "@/types/shippingMethod"
import { ShippingMethodForm } from "@/components/ShippingMethodForm"
import { ShopSettings } from "@/types/store"

export default function EditShippingMethodPage() {
  const { id } = useParams()
  const { 
    shopSettings, 
    fetchShopSettings,
    shippingMethods,
    fetchShippingMethods,
    fetchShippingMethodsByStore,
    updateShippingMethod,
    currentStore
  } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialData, setInitialData] = useState<ShippingMethod | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Cargar configuración de tienda si no está disponible
        if (!shopSettings) {
          await fetchShopSettings()
        }
        
        // Cargar métodos de envío si no están disponibles
        if (!shippingMethods || shippingMethods.length === 0) {
          await fetchShippingMethodsByStore(currentStore || undefined)
        }
        
        // Buscar el método específico
        const method = shippingMethods?.find(m => m.id === id)
        
        if (!method) {
          toast({
            variant: "destructive",
            title: "❌ Método no encontrado",
            description: "El método de envío que intentas editar no existe",
          })
          redirect("/settings")
          return
        }
        
        setInitialData(method)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "❌ Error",
          description: "No se pudo cargar la información del método de envío",
        })
        redirect("/settings")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, shopSettings, shippingMethods, fetchShopSettings, fetchShippingMethodsByStore, currentStore, toast])

  const handleSubmit = async (data: CreateShippingMethodDto) => {
    setIsSubmitting(true)
    try {
      const result = await updateShippingMethod(id as string, data)
      if (result) {
        toast({
          title: "✅ Método actualizado",
          description: "El método de envío ha sido modificado correctamente",
        })
        // Pequeño delay para asegurar que el toast se muestre antes de redirigir
        setTimeout(() => {
          redirect("/settings")
        }, 100)
      }
    } catch (error) {
      console.error("Error updating shipping method:", error)
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "No se pudo actualizar el método de envío. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !shopSettings) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-64 bg-muted rounded-md"></div>
          <div className="h-96 w-full max-w-4xl bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {initialData ? `Editar ${initialData.name}` : 'Editar método de envío'}
        </h1>
        <p className="text-muted-foreground">
          Modifica los detalles de este método de envío
        </p>
      </div>
      
      {initialData ? (
        <ShippingMethodForm 
          shopSettings={shopSettings[0]} 
          initialData={initialData}
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se encontró el método de envío solicitado
          </p>
        </div>
      )}
      </div>
    </div>
  )
}