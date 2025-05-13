"use client"

import type React from "react"

import { memo, useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { CreateOrderDto, UpdateOrderDto, AddressInfo } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, Home, Building, MapPinned, Globe, Phone } from "lucide-react"
import { User } from "lucide-react"

interface ShippingAndBillingProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
}

export const ShippingAndBilling = memo(function ShippingAndBilling({ formData, setFormData }: ShippingAndBillingProps) {
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Asegurar que las direcciones siempre sean objetos
  const shippingAddress = formData.shippingAddress || {}
  const billingAddress = formData.billingAddress || {}

  // Inicializar solo una vez
  useEffect(() => {
    if (!initialized) {
      // Si sameAsBilling está marcado, copiar la dirección de envío a facturación
      if (sameAsBilling && formData.shippingAddress) {
        setFormData((prev) => ({
          ...prev,
          billingAddress: prev.shippingAddress,
        }))
      }
      setInitialized(true)
    }
  }, [initialized, sameAsBilling, formData.shippingAddress, setFormData])

  const handleShippingChange = (field: keyof AddressInfo, value: string) => {
    const newShippingAddress = {
      ...shippingAddress,
      [field]: value,
    }

    setFormData((prev) => ({
      ...prev,
      shippingAddress: newShippingAddress,
      // Si está marcado "Igual que envío", actualizar también la dirección de facturación
      ...(sameAsBilling && { billingAddress: newShippingAddress }),
    }))
  }

  const handleBillingChange = (field: keyof AddressInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
    }))
  }

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked)

    if (checked) {
      // Copiar dirección de envío a facturación
      setFormData((prev) => ({
        ...prev,
        billingAddress: prev.shippingAddress,
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Direcciones</h2>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Paso 3 de 4
        </Badge>
      </div>

      {/* Dirección de Envío */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-success" />
          Dirección de Envío
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-name" className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-gray-500" />
              Nombre del destinatario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipping-name"
              value={shippingAddress.name || ""}
              onChange={(e) => handleShippingChange("name", e.target.value)}
              placeholder="Nombre completo"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-address1" className="flex items-center gap-1.5">
              <Home className="h-4 w-4 text-gray-500" />
              Dirección <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipping-address1"
              value={shippingAddress.address1 || ""}
              onChange={(e) => handleShippingChange("address1", e.target.value)}
              placeholder="Calle, número, piso"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-address2" className="flex items-center gap-1.5">
              <Building className="h-4 w-4 text-gray-500" />
              Dirección adicional (opcional)
            </Label>
            <Input
              id="shipping-address2"
              value={shippingAddress.address2 || ""}
              onChange={(e) => handleShippingChange("address2", e.target.value)}
              placeholder="Urbanización, bloque, etc."
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-city" className="flex items-center gap-1.5">
                <MapPinned className="h-4 w-4 text-gray-500" />
                Ciudad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shipping-city"
                value={shippingAddress.city || ""}
                onChange={(e) => handleShippingChange("city", e.target.value)}
                placeholder="Ciudad"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-state">Provincia</Label>
              <Input
                id="shipping-state"
                value={shippingAddress.state || ""}
                onChange={(e) => handleShippingChange("state", e.target.value)}
                placeholder="Provincia"
                className="bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-postalCode">Código Postal</Label>
              <Input
                id="shipping-postalCode"
                value={shippingAddress.postalCode || ""}
                onChange={(e) => handleShippingChange("postalCode", e.target.value)}
                placeholder="Código postal"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-country" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-gray-500" />
                País <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shipping-country"
                value={shippingAddress.country || ""}
                onChange={(e) => handleShippingChange("country", e.target.value)}
                placeholder="País"
                className="bg-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-phone" className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-gray-500" />
              Teléfono de contacto
            </Label>
            <Input
              id="shipping-phone"
              value={shippingAddress.phone || ""}
              onChange={(e) => handleShippingChange("phone", e.target.value)}
              placeholder="Teléfono"
              className="bg-white"
            />
          </div>
        </div>
      </div>

      {/* Dirección de Facturación */}
      <div className="bg-white p-5 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600"
            >
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <path d="M16 2v4h4" />
              <path d="M8 10h8" />
              <path d="M8 14h8" />
              <path d="M8 18h5" />
            </svg>
            Dirección de Facturación
          </h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsBilling}
              onCheckedChange={(checked) => handleSameAsBillingChange(checked === true)}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="same-as-shipping" className="text-sm font-normal">
              Igual que dirección de envío
            </Label>
          </div>
        </div>

        {!sameAsBilling && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing-name">Nombre</Label>
              <Input
                id="billing-name"
                value={billingAddress.name || ""}
                onChange={(e) => handleBillingChange("name", e.target.value)}
                placeholder="Nombre completo"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-address1">Dirección</Label>
              <Input
                id="billing-address1"
                value={billingAddress.address1 || ""}
                onChange={(e) => handleBillingChange("address1", e.target.value)}
                placeholder="Calle, número, piso"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-address2">Dirección adicional (opcional)</Label>
              <Input
                id="billing-address2"
                value={billingAddress.address2 || ""}
                onChange={(e) => handleBillingChange("address2", e.target.value)}
                placeholder="Urbanización, bloque, etc."
                className="bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing-city">Ciudad</Label>
                <Input
                  id="billing-city"
                  value={billingAddress.city || ""}
                  onChange={(e) => handleBillingChange("city", e.target.value)}
                  placeholder="Ciudad"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-state">Provincia</Label>
                <Input
                  id="billing-state"
                  value={billingAddress.state || ""}
                  onChange={(e) => handleBillingChange("state", e.target.value)}
                  placeholder="Provincia"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing-postalCode">Código Postal</Label>
                <Input
                  id="billing-postalCode"
                  value={billingAddress.postalCode || ""}
                  onChange={(e) => handleBillingChange("postalCode", e.target.value)}
                  placeholder="Código postal"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-country">País</Label>
                <Input
                  id="billing-country"
                  value={billingAddress.country || ""}
                  onChange={(e) => handleBillingChange("country", e.target.value)}
                  placeholder="País"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-phone">Teléfono de contacto</Label>
              <Input
                id="billing-phone"
                value={billingAddress.phone || ""}
                onChange={(e) => handleBillingChange("phone", e.target.value)}
                placeholder="Teléfono"
                className="bg-white"
              />
            </div>
          </div>
        )}
        {sameAsBilling && (
          <div className="bg-primary/10 p-3 rounded-md border border-primary/20 text-primary text-sm">
            Se utilizará la misma dirección de envío para la facturación.
          </div>
        )}
      </div>
    </div>
  )
})
