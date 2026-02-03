"use client"

import type React from "react"

import { memo, useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { AddressInfo } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, Home, Building, MapPinned, Globe, Phone, User } from "lucide-react"
import type { OrderFormState } from "./orderFormTypes"
import { SectionErrorHint } from "./SectionErrorHint"

interface ShippingAndBillingProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
  sectionErrors?: string[]
}

export const ShippingAndBilling = memo(function ShippingAndBilling({
  formData,
  setFormData,
  sectionErrors,
}: ShippingAndBillingProps) {
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
      <SectionErrorHint title="Ajusta las direcciones o método de envío" messages={sectionErrors} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Direcciones</h2>
        </div>
        <Badge variant="outline" className="border-border/40 bg-background/60 text-xs font-medium text-muted-foreground">
          Paso 3 de 4
        </Badge>
      </div>

      {/* Dirección de Envío */}
      <section className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Dirección de envío
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="shipping-name"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre del destinatario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipping-name"
              value={shippingAddress.name || ""}
              onChange={(e) => handleShippingChange("name", e.target.value)}
              placeholder="Nombre completo"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="shipping-address1"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              Dirección <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipping-address1"
              value={shippingAddress.address1 || ""}
              onChange={(e) => handleShippingChange("address1", e.target.value)}
              placeholder="Calle, número, piso"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="shipping-address2"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <Building className="h-4 w-4 text-muted-foreground" />
              Dirección adicional (opcional)
            </Label>
            <Input
              id="shipping-address2"
              value={shippingAddress.address2 || ""}
              onChange={(e) => handleShippingChange("address2", e.target.value)}
              placeholder="Urbanización, bloque, etc."
              className="bg-background"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="shipping-city"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              >
                <MapPinned className="h-4 w-4 text-muted-foreground" />
                Ciudad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shipping-city"
                value={shippingAddress.city || ""}
                onChange={(e) => handleShippingChange("city", e.target.value)}
                placeholder="Ciudad"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-state" className="text-sm font-medium text-muted-foreground">
                Provincia
              </Label>
              <Input
                id="shipping-state"
                value={shippingAddress.state || ""}
                onChange={(e) => handleShippingChange("state", e.target.value)}
                placeholder="Provincia"
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-postalCode" className="text-sm font-medium text-muted-foreground">
                Código Postal
              </Label>
              <Input
                id="shipping-postalCode"
                value={shippingAddress.postalCode || ""}
                onChange={(e) => handleShippingChange("postalCode", e.target.value)}
                placeholder="Código postal"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="shipping-country"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                País <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shipping-country"
                value={shippingAddress.country || ""}
                onChange={(e) => handleShippingChange("country", e.target.value)}
                placeholder="País"
                className="bg-background"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="shipping-phone"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono de contacto
            </Label>
            <Input
              id="shipping-phone"
              value={shippingAddress.phone || ""}
              onChange={(e) => handleShippingChange("phone", e.target.value)}
              placeholder="Teléfono"
              className="bg-background"
            />
          </div>
        </div>
      </section>

      {/* Dirección de Facturación */}
      <section className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
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
              className="text-primary"
            >
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <path d="M16 2v4h4" />
              <path d="M8 10h8" />
              <path d="M8 14h8" />
              <path d="M8 18h5" />
            </svg>
            Dirección de facturación
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsBilling}
              onCheckedChange={(checked) => handleSameAsBillingChange(checked === true)}
              className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <Label htmlFor="same-as-shipping" className="text-sm font-normal">
              Igual que dirección de envío
            </Label>
          </div>
        </div>

        {!sameAsBilling ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing-name" className="text-sm font-medium text-muted-foreground">
                Nombre
              </Label>
              <Input
                id="billing-name"
                value={billingAddress.name || ""}
                onChange={(e) => handleBillingChange("name", e.target.value)}
                placeholder="Nombre completo"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-address1" className="text-sm font-medium text-muted-foreground">
                Dirección
              </Label>
              <Input
                id="billing-address1"
                value={billingAddress.address1 || ""}
                onChange={(e) => handleBillingChange("address1", e.target.value)}
                placeholder="Calle, número, piso"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-address2" className="text-sm font-medium text-muted-foreground">
                Dirección adicional (opcional)
              </Label>
              <Input
                id="billing-address2"
                value={billingAddress.address2 || ""}
                onChange={(e) => handleBillingChange("address2", e.target.value)}
                placeholder="Urbanización, bloque, etc."
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing-city" className="text-sm font-medium text-muted-foreground">
                  Ciudad
                </Label>
                <Input
                  id="billing-city"
                  value={billingAddress.city || ""}
                  onChange={(e) => handleBillingChange("city", e.target.value)}
                  placeholder="Ciudad"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-state" className="text-sm font-medium text-muted-foreground">
                  Provincia
                </Label>
                <Input
                  id="billing-state"
                  value={billingAddress.state || ""}
                  onChange={(e) => handleBillingChange("state", e.target.value)}
                  placeholder="Provincia"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing-postalCode" className="text-sm font-medium text-muted-foreground">
                  Código Postal
                </Label>
                <Input
                  id="billing-postalCode"
                  value={billingAddress.postalCode || ""}
                  onChange={(e) => handleBillingChange("postalCode", e.target.value)}
                  placeholder="Código postal"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-country" className="text-sm font-medium text-muted-foreground">
                  País
                </Label>
                <Input
                  id="billing-country"
                  value={billingAddress.country || ""}
                  onChange={(e) => handleBillingChange("country", e.target.value)}
                  placeholder="País"
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-phone" className="text-sm font-medium text-muted-foreground">
                Teléfono de contacto
              </Label>
              <Input
                id="billing-phone"
                value={billingAddress.phone || ""}
                onChange={(e) => handleBillingChange("phone", e.target.value)}
                placeholder="Teléfono"
                className="bg-background"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border/30 bg-muted/20 p-3 text-sm text-muted-foreground">
            Se utilizará la misma dirección de envío para la facturación.
          </div>
        )}
      </section>
    </div>
  )
})
