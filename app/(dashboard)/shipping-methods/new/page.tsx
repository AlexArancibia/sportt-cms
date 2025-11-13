"use client"
import { useMainStore } from "@/stores/mainStore"
import { redirect } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { CreateShippingMethodDto } from "@/types/shippingMethod"
import { ShippingMethodForm } from "@/components/ShippingMethodForm"

export default function NewShippingMethodPage() {
  const { createShippingMethod, shopSettings, fetchShopSettings } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!shopSettings) {

      fetchShopSettings()
      
    }
  }, [shopSettings, fetchShopSettings])

  if (!shopSettings) {
    return <div>Cargando configuración de la tienda...</div>
  }

  const handleSubmit = async (data: CreateShippingMethodDto) => {
    setIsSubmitting(true)
    try {
      const targetStoreId = shopSettings?.[0]?.storeId
      const result = await createShippingMethod(data, targetStoreId)
      if (result) {
        toast({
          title: "✅ Método creado",
          description: "El nuevo método de envío ha sido registrado",
        })
        // Pequeño delay para asegurar que el toast se muestre antes de redirigir
        setTimeout(() => {
          redirect("/settings")
        }, 100)
      }
    } catch (error) {
      console.error("Error creating shipping method:", error)
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "No se pudo crear el método de envío. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <div className="container mx-auto py-8">
        <ShippingMethodForm 
          shopSettings={shopSettings[0]} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  )
}