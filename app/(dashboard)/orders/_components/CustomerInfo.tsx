"use client"

import type React from "react"

import { memo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { AtSign, Building2, Phone, User, UserRound } from "lucide-react"

interface CustomerInfoProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
}

export const CustomerInfo = memo(function CustomerInfo({ formData, setFormData }: CustomerInfoProps) {
  // Asegurar que customerInfo siempre sea un objeto
  const customerInfo = formData.customerInfo || {}

  const handleCustomerInfoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <UserRound className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Información del cliente</h2>
        </div>
        <Badge variant="outline" className="border-border/40 bg-background/60 text-xs font-medium text-muted-foreground">
          Paso 2 de 4
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="customer-name"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customer-name"
            value={customerInfo.name || ""}
            onChange={(e) => handleCustomerInfoChange("name", e.target.value)}
            placeholder="Nombre completo"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-email"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <AtSign className="h-4 w-4 text-muted-foreground" />
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customer-email"
            type="email"
            value={customerInfo.email || ""}
            onChange={(e) => handleCustomerInfoChange("email", e.target.value)}
            placeholder="correo@ejemplo.com"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-phone"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            Teléfono
          </Label>
          <Input
            id="customer-phone"
            value={customerInfo.phone || ""}
            onChange={(e) => handleCustomerInfoChange("phone", e.target.value)}
            placeholder="+51 999 888 777"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-company"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Empresa (opcional)
          </Label>
          <Input
            id="customer-company"
            value={customerInfo.company || ""}
            onChange={(e) => handleCustomerInfoChange("company", e.target.value)}
            placeholder="Nombre de la empresa"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-taxId"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="16" height="12" x="4" y="6" rx="2" />
              <path d="M9 6v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <path d="M8 12h8" />
              <path d="M8 15h5" />
            </svg>
            RUC/DNI (opcional)
          </Label>
          <Input
            id="customer-taxId"
            value={customerInfo.taxId || ""}
            onChange={(e) => handleCustomerInfoChange("taxId", e.target.value)}
            placeholder="20123456789"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-notes"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M9 9h1" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
            Notas adicionales
          </Label>
          <Input
            id="customer-notes"
            value={customerInfo.notes || ""}
            onChange={(e) => handleCustomerInfoChange("notes", e.target.value)}
            placeholder="Información adicional del cliente"
            className="bg-background"
          />
        </div>
      </div>
    </div>
  )
})
