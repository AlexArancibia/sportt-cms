"use client"

import { useState, useEffect, useCallback } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Loader2, Upload, X, Save, Facebook, Instagram, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import apiClient from "@/lib/axiosConfig"
import type { ShopSettings, UpdateShopSettingsDto } from "@/types/shopSettings"
import type { Currency } from "@/types/currency"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ShopSettings() {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const {
    fetchShopSettings,
    saveShopSettings,
    fetchCurrencies,
    currencies,
    addAcceptedCurrency,
    removeAcceptedCurrency,
  } = useMainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const fetchedSettings = await fetchShopSettings()
        setShopSettings(Array.isArray(fetchedSettings) ? fetchedSettings[0] || null : fetchedSettings)
        await fetchCurrencies()
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los ajustes de la tienda",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchShopSettings, fetchCurrencies, toast])

  const handleInputChange = useCallback(
    (key: keyof ShopSettings, value: string | number | boolean) => {
      if (!shopSettings) return
      setShopSettings((prev) => (prev ? { ...prev, [key]: value } : null))
    },
    [shopSettings],
  )

  const handleSave = async () => {
    if (!shopSettings) return
    setIsSaving(true)
    try {
      const { id, createdAt, updatedAt, acceptedCurrencies, ...updateData } = shopSettings
      const updatedSettings = await saveShopSettings(updateData as UpdateShopSettingsDto)
      setShopSettings(updatedSettings)
      toast({ title: "Éxito", description: "Ajustes actualizados correctamente" })
    } catch (error) {
      console.error("Error al guardar ajustes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los ajustes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("description", "Logo de la Tienda")

      try {
        const response = await apiClient.post("/file/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        handleInputChange("logo", response.data.filename)
        toast({ title: "Éxito", description: "Logo subido correctamente" })
      } catch (error) {
        console.error("Error al subir el logo:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo subir el logo",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [toast, handleInputChange],
  )

  const handleAddAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return
    try {
      const updatedShop = await addAcceptedCurrency(shopSettings.id, currencyId)
      setShopSettings(updatedShop)
      toast({ title: "Éxito", description: "Moneda añadida correctamente" })
    } catch (error) {
      console.error("Error al añadir moneda:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir la moneda",
      })
    }
  }

  const handleRemoveAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return
    try {
      const updatedShop = await removeAcceptedCurrency(shopSettings.id, currencyId)
      setShopSettings(updatedShop)
      toast({ title: "Éxito", description: "Moneda eliminada correctamente" })
    } catch (error) {
      console.error("Error al eliminar moneda:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la moneda",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shopSettings) {
    return <div className="text-center">No se encontraron ajustes de la tienda.</div>
  }

  return (
  
<>
      <div className="container-section pb-0">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3 className=" ">Información General</h3>
            <div className="flex gap-2 justify-center items-center">
            <p className="text-sm text-gray-500">Detalles básicos sobre tu tienda</p>
              <Button onClick={handleSave} className="bg-gradient-to-br from-lime-100 to-lime-300 text-black  shadow-none">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin  " /> : <Save className="h-4 w-4 " />}
                  
                  </Button>
                  </div>
            
          </div>
          <div className="box-section">
            <div className="flex items-center space-x-4">
              <div className="w-36 h-24 relative overflow-hidden rounded-md">
                <Image
                  src={getImageUrl(shopSettings.logo) || "/placeholder.svg"}
                  alt="Logo de la Tienda"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
              <div>
                <Input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  accept="image/*"
                  disabled={isUploading}
                />
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {shopSettings.logo ? "Cambiar Logo" : "Subir Logo"}
                </Label>
              </div>
            </div>
          </div>
          <div className="box-section  border-b-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 flex w-[300px] flex-col">
                <Label htmlFor="name">Nombre de la Tienda</Label>
                <Input
                  id="name"
                  value={shopSettings.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ingresa el nombre de tu tienda"
                />
              </div>
              <div className="space-y-2 flex w-[300px] flex-col">
                <Label htmlFor="domain">Dominio</Label>
                <Input
                  id="domain"
                  value={shopSettings.domain}
                  onChange={(e) => handleInputChange("domain", e.target.value)}
                  placeholder="tudominio.com"
                />
              </div>
              <div className="space-y-2 flex w-[300px] flex-col">
              <Label htmlFor="email">Correo Electrónico de Contacto</Label>
              <Input
                id="email"
                value={shopSettings.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contacto@tudominio.com"
              />
            </div>

            <div className="space-y-2 flex w-full flex-col">
              <Label htmlFor="description">Descripción de la Tienda</Label>
              <Input
                id="description"
                value={shopSettings.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe tu tienda en pocas palabras..."
              />
            </div>


            </div>
          </div>
 
        </div>
      </div>

      <div className="container-section pb-0">
        <div className="content-section box-container">
          <div className="box-section justify-between ">
            <h3  >Configuración de Monedas</h3>
            <div className="flex gap-2 justify-center items-center">
            <p className="text-sm text-gray-500">Gestiona las opciones de moneda de tu tienda</p>
              <Button onClick={handleSave} className="bg-gradient-to-br from-lime-100 to-lime-300 text-black  shadow-none">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin  " /> : <Save className="h-4 w-4 " />}
                  
                  </Button>
                  </div>
          </div>
          <div className="box-section">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Moneda Predeterminada</Label>
              <Select
                value={shopSettings.defaultCurrencyId}
                onValueChange={(value) => handleInputChange("defaultCurrencyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la moneda predeterminada" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency: Currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="box-section">
            <div className="space-y-2">
              <Label>Monedas Aceptadas</Label>
              <div className="flex flex-wrap gap-2 items-center">
                {shopSettings.acceptedCurrencies.map((currency) => (
                  <div
                    key={currency.id}
                    className="flex items-center text-xs border h-6  border-sky-500 text-secondary-foreground rounded-full px-3 py-0"
                  >
                    <span>{currency.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0"
                      onClick={() => handleRemoveAcceptedCurrency(currency.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={handleAddAcceptedCurrency}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Añadir moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies
                      .filter((c) => !shopSettings.acceptedCurrencies.some((ac) => ac.id === c.id))
                      .map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="box-section">
            <div className="flex items-center space-x-2">
              <Switch
                id="taxesIncluded"
                checked={shopSettings.taxesIncluded}
                onCheckedChange={(checked) => handleInputChange("taxesIncluded", checked)}
              />
              <Label htmlFor="taxesIncluded">Impuestos Incluidos en los Precios</Label>
            </div>
          </div>
          <div className="box-section border-b-0">
            <div className="space-y-2">
              <Label htmlFor="taxValue">Valor del Impuesto (%)</Label>
              <Input
                id="taxValue"
                type="number"
                value={shopSettings.taxValue || ""}
                onChange={(e) => handleInputChange("taxValue", Number.parseFloat(e.target.value))}
                placeholder="Ingresa el porcentaje de impuesto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-section pb-0">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Configuración de Apariencia</h3>
            <div className="flex gap-2 justify-center items-center">
            <p className="text-sm text-gray-500">Personaliza el aspecto de tu tienda</p>
              <Button onClick={handleSave} className="bg-gradient-to-br from-lime-100 to-lime-300 text-black  shadow-none">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin  " /> : <Save className="h-4 w-4 " />}
                  
                  </Button>
                  </div>
        
          </div>
          <div className="box-section border-b-0 ">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Color Primario</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={shopSettings.primaryColor || "#000000"}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    className="w-12 h-12 p-1 rounded-md"
                  />
                  <Input
                    type="text"
                    value={shopSettings.primaryColor || "#000000"}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    className="flex-grow"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Color Secundario</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={shopSettings.secondaryColor || "#ffffff"}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    className="w-12 h-12 p-1 rounded-md"
                  />
                  <Input
                    type="text"
                    value={shopSettings.secondaryColor || "#ffffff"}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    className="flex-grow"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Enlaces de Redes Sociales</h3>
            <div className="flex gap-2 justify-center items-center">
            <p className="text-sm text-gray-500">Conecta tu tienda con las plataformas de redes sociales</p>
              <Button onClick={handleSave} className="bg-gradient-to-br from-lime-100 to-lime-300 text-black  shadow-none">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin  " /> : <Save className="h-4 w-4 " />}
                  
                  </Button>
                  </div>
            
          </div>
          <div className="box-section">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl" className="flex items-center">
                <Facebook className="h-4 w-4 mr-2" />
                URL de Facebook
              </Label>
              <Input
                id="facebookUrl"
                value={shopSettings.facebookUrl || ""}
                onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/tupagina"
              />
            </div>
          </div>
          <div className="box-section">
            <div className="space-y-2">
              <Label htmlFor="instagramUrl" className="flex items-center">
                <Instagram className="h-4 w-4 mr-2" />
                URL de Instagram
              </Label>
              <Input
                id="instagramUrl"
                value={shopSettings.instagramUrl || ""}
                onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/tucuenta"
              />
            </div>
          </div>
          <div className="box-section border-b-0">
            <div className="space-y-2">
              <Label htmlFor="twitterUrl" className="flex items-center">
                <Twitter className="h-4 w-4 mr-2" />
                URL de Twitter
              </Label>
              <Input
                id="twitterUrl"
                value={shopSettings.twitterUrl || ""}
                onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/tucuenta"
              />
            </div>
          </div>
        </div>
      </div>
 
    </>
  )
}

