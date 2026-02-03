"use client"

import type React from "react"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PaymentStatus } from "@/types/common"
import type { PaymentProvider } from "@/types/payments"
import type { OrderFormState } from "./orderFormTypes"
import { SectionErrorHint } from "./SectionErrorHint"

interface PaymentAndDiscountsProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
  paymentProviders: PaymentProvider[]
  sectionErrors?: string[]
  readOnly?: boolean
}

const paymentStatusLabels: Record<string, string> = {
  [PaymentStatus.PENDING]: "Pendiente",
  [PaymentStatus.COMPLETED]: "Completado",
  [PaymentStatus.FAILED]: "Fallido",
}

export const PaymentAndDiscounts = memo(function PaymentAndDiscounts({
  formData,
  setFormData,
  paymentProviders,
  sectionErrors,
  readOnly = false,
}: PaymentAndDiscountsProps) {
  const handlePaymentProviderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentProviderId: value,
    }))
  }

  const handlePaymentStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: value as PaymentStatus,
    }))
  }

  const getProviderDisplayName = (provider: PaymentProvider) => {
    return provider.isActive ? `${provider.name} (via web)` : provider.name
  }

  if (readOnly) {
    const provider = formData.paymentProviderId
      ? paymentProviders.find((p) => p.id === formData.paymentProviderId)
      : null
    const paymentStatusLabel =
      formData.paymentStatus && paymentStatusLabels[formData.paymentStatus]
        ? paymentStatusLabels[formData.paymentStatus]
        : formData.paymentStatus ?? "—"
    return (
      <Card className="border-border/30 bg-card/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Pago y descuentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Método de pago</p>
            <p className="text-sm font-medium">{provider ? getProviderDisplayName(provider) : "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Estado del pago</p>
            <Badge variant="outline" className="font-normal">
              {paymentStatusLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/30 bg-card/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">Pago y descuentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionErrorHint title="Confirma los datos de pago" messages={sectionErrors} />
        <div className="space-y-2">
          <Label htmlFor="payment-provider" className="text-sm font-medium text-muted-foreground">
            Método de pago
          </Label>
          <Select value={formData.paymentProviderId || ""} onValueChange={handlePaymentProviderChange}>
            <SelectTrigger id="payment-provider" className="w-full bg-background">
              <SelectValue placeholder="Seleccionar método de pago" />
            </SelectTrigger>
            <SelectContent>
              {paymentProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {getProviderDisplayName(provider)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-status" className="text-sm font-medium text-muted-foreground">
            Estado del pago
          </Label>
          <Select value={formData.paymentStatus || ""} onValueChange={handlePaymentStatusChange}>
            <SelectTrigger id="payment-status" className="w-full bg-background">
              <SelectValue placeholder="Seleccionar estado del pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentStatus.PENDING}>Pendiente</SelectItem>
              <SelectItem value={PaymentStatus.COMPLETED}>Completado</SelectItem>
              <SelectItem value={PaymentStatus.FAILED}>Fallido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
})
