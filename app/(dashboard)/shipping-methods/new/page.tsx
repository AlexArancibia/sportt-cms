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
      await createShippingMethod(data)
      toast({
        title: "✅ Método creado",
        description: "El nuevo método de envío ha sido registrado",
      })
      
      setIsSubmitting(false)
      redirect("/settings")
    
  }

  return (
    <div className="container mx-auto py-8">
      <ShippingMethodForm 
        shopSettings={shopSettings[0]} 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </div>
  )
}