"use client"

import type React from "react"

import { memo, useMemo, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PlusCircle,
  Trash2,
  DollarSign,
  Tag,
  Hash,
  ShoppingCart,
  InfoIcon,
  ChevronDown,
  ScanLine,
  AlertCircle,
} from "lucide-react"
import type { Product } from "@/types/product"
import type { Currency } from "@/types/currency"
import type { Coupon } from "@/types/coupon"
import type { ShippingMethod } from "@/types/shippingMethod"
import type { ShopSettings } from "@/types/store"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { DiscountType } from "@/types/common"
import type { OrderFormState } from "./orderFormTypes"
import { SectionErrorHint } from "./SectionErrorHint"
import { Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const roundCurrency = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100

const areClose = (a: number, b: number, tolerance = 0.005) => Math.abs(a - b) < tolerance

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

interface OrderDetailsProps {
  formData: OrderFormState
  setFormData: React.Dispatch<React.SetStateAction<OrderFormState>>
  products: Product[]
  currencies: Currency[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  shopSettings: ShopSettings[]
  setIsProductDialogOpen: (open: boolean) => void
  setIsPOSDialogOpen: (open: boolean) => void
  sectionErrors?: string[]
  isEditMode?: boolean
}

export const OrderDetails = memo(function OrderDetails({
  formData,
  setFormData,
  products,
  currencies,
  coupons,
  shippingMethods,
  shopSettings,
  setIsProductDialogOpen,
  setIsPOSDialogOpen,
  sectionErrors,
  isEditMode = false,
}: OrderDetailsProps) {
  const currentShopSettings = useMemo(() => (shopSettings && shopSettings.length > 0 ? shopSettings[0] : null), [shopSettings])

  const taxesIncluded = useMemo(() => currentShopSettings?.taxesIncluded || false, [currentShopSettings])

  const taxRate = useMemo(() => {
    if (currentShopSettings?.taxValue === undefined || currentShopSettings?.taxValue === null) {
      return 0
    }
    return currentShopSettings.taxValue > 1 ? currentShopSettings.taxValue / 100 : currentShopSettings.taxValue
  }, [currentShopSettings])

  const priceBreakdown = useMemo(() => {
    const grossTotal = formData.lineItems.reduce((sum, item) => {
      const price = toNumber(item.price)
      const quantity = toNumber(item.quantity)
      return sum + price * quantity
    }, 0)

    const lineItemDiscountTotal = formData.lineItems.reduce((sum, item) => {
      const discount = toNumber(item.totalDiscount)
      return sum + discount
    }, 0)

    const subtotalBeforeDiscount =
      taxesIncluded && taxRate > 0 ? grossTotal / (1 + taxRate) : grossTotal
    const subtotalAfterLineItemDiscount = Math.max(0, subtotalBeforeDiscount - lineItemDiscountTotal)

    return {
      grossTotal,
      subtotalBeforeDiscount,
      lineItemDiscountTotal,
      subtotalAfterLineItemDiscount,
    }
  }, [formData.lineItems, taxesIncluded, taxRate])

  const couponEvaluation = useMemo(() => {
    if (!formData.couponId) {
      return {
        coupon: undefined as Coupon | undefined,
        discount: 0,
        isValid: false,
        message: "",
      }
    }

    const coupon = coupons.find((c) => c.id === formData.couponId)
    if (!coupon) {
      return {
        coupon: undefined,
        discount: 0,
        isValid: false,
        message: "Cupón no encontrado",
      }
    }

    const now = new Date()
    const startDate = coupon.startDate ? new Date(coupon.startDate) : undefined
    const endDate = coupon.endDate ? new Date(coupon.endDate) : undefined

    if (!coupon.isActive) {
      return { coupon, discount: 0, isValid: false, message: "El cupón está inactivo" }
    }

    if (startDate && startDate > now) {
      return { coupon, discount: 0, isValid: false, message: "El cupón aún no está vigente" }
    }

    if (endDate && endDate < now) {
      return { coupon, discount: 0, isValid: false, message: "El cupón ha expirado" }
    }

    const minPurchase = Number(coupon.minPurchase || 0)
    if (minPurchase > 0 && priceBreakdown.subtotalBeforeDiscount < minPurchase) {
      return {
        coupon,
        discount: 0,
        isValid: false,
        message: `Subtotal mínimo no alcanzado (${minPurchase.toFixed(2)})`,
      }
    }

    const discountBase = priceBreakdown.subtotalBeforeDiscount
    const discountCapacity = Math.max(0, priceBreakdown.subtotalAfterLineItemDiscount)
    let discountAmount = 0

    switch (coupon.type) {
      case DiscountType.PERCENTAGE: {
        const percentage = Number(coupon.value || 0) / 100
        discountAmount = discountBase * (Number.isFinite(percentage) ? percentage : 0)
        break
      }
      case DiscountType.FIXED_AMOUNT: {
        discountAmount = Number(coupon.value || 0)
        break
      }
      case DiscountType.FREE_SHIPPING:
        return {
          coupon,
          discount: 0,
          isValid: false,
          message: "Cupón de envío gratis (no afecta el subtotal)",
        }
      case DiscountType.BUY_X_GET_Y:
        return {
          coupon,
          discount: 0,
          isValid: false,
          message: "Tipo de cupón no soportado en pedidos manuales",
        }
      default:
        discountAmount = 0
    }

    const sanitizedDiscount = Math.min(Math.max(0, discountAmount), discountCapacity)
    const roundedSanitizedDiscount = roundCurrency(sanitizedDiscount)

    if (roundedSanitizedDiscount <= 0) {
      return {
        coupon,
        discount: 0,
        isValid: false,
        message: "El cupón no aplica al subtotal actual",
      }
    }

    return {
      coupon,
      discount: roundedSanitizedDiscount,
      isValid: true,
      message: "",
    }
  }, [formData.couponId, coupons, priceBreakdown.subtotalAfterLineItemDiscount, priceBreakdown.subtotalBeforeDiscount])

  const totals = useMemo(() => {
    const subtotalBefore = priceBreakdown.subtotalBeforeDiscount
    const lineDiscount = priceBreakdown.lineItemDiscountTotal
    const couponDiscountRounded = roundCurrency(couponEvaluation.discount)
    const maxManual = Math.max(0, priceBreakdown.subtotalAfterLineItemDiscount - couponDiscountRounded)
    const manualRaw = toNumber(formData.manualDiscountTotal)
    const manualSafe = clamp(manualRaw, 0, maxManual)
    const totalDiscountRaw = lineDiscount + couponDiscountRounded + manualSafe
    const subtotalAfterDiscountRaw = Math.max(0, subtotalBefore - totalDiscountRaw)
    const taxAmount = subtotalAfterDiscountRaw * taxRate
    const total = subtotalAfterDiscountRaw + taxAmount

    return {
      subtotalBefore,
      subtotalBeforeRounded: roundCurrency(subtotalBefore),
      lineDiscount,
      couponDiscountRounded,
      maxManual,
      maxManualRounded: roundCurrency(maxManual),
      manualSafe,
      totalDiscountRaw,
      totalDiscountRounded: roundCurrency(totalDiscountRaw),
      subtotalAfterDiscountRounded: roundCurrency(subtotalAfterDiscountRaw),
      taxAmount,
      taxRounded: roundCurrency(taxAmount),
      total,
      totalRounded: roundCurrency(total),
    }
  }, [couponEvaluation.discount, formData.manualDiscountTotal, priceBreakdown, taxRate])

  const {
    subtotalBefore,
    subtotalBeforeRounded,
    lineDiscount,
    couponDiscountRounded,
    maxManual,
    maxManualRounded,
    manualSafe,
    totalDiscountRaw,
    totalDiscountRounded,
    subtotalAfterDiscountRounded,
    taxAmount,
    taxRounded,
    total,
    totalRounded,
  } = totals

  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [desiredTotalInput, setDesiredTotalInput] = useState<string>("0.00")
  const [isDiscountSectionOpen, setIsDiscountSectionOpen] = useState(false)

  useEffect(() => {
    if (!isEditingTotal) {
      const formatted = Number.isFinite(totalRounded) ? totalRounded.toFixed(2) : "0.00"
      setDesiredTotalInput(formatted)
    }
  }, [isEditingTotal, totalRounded])

  useEffect(() => {
    const updates: Partial<OrderFormState> = {}

    const currentManual = toNumber(formData.manualDiscountTotal || 0)
    if (!areClose(currentManual, manualSafe, 0.000001)) {
      updates.manualDiscountTotal = manualSafe
    }

    const currentCoupon = roundCurrency(formData.couponDiscountTotal || 0)
    if (!areClose(currentCoupon, couponDiscountRounded)) {
      updates.couponDiscountTotal = couponDiscountRounded
    }

    const currentSubtotal = toNumber(formData.subtotalPrice || 0)
    if (!areClose(currentSubtotal, subtotalBefore, 0.000001)) {
      updates.subtotalPrice = subtotalBefore
    }

    const currentTotalDiscounts = toNumber(formData.totalDiscounts || 0)
    if (!areClose(currentTotalDiscounts, totalDiscountRaw, 0.000001)) {
      updates.totalDiscounts = totalDiscountRaw
    }

    const currentTax = toNumber(formData.totalTax || 0)
    if (!areClose(currentTax, taxAmount, 0.000001)) {
      updates.totalTax = taxAmount
    }

    const currentTotal = roundCurrency(formData.totalPrice || 0)
    if (!areClose(currentTotal, totalRounded)) {
      updates.totalPrice = totalRounded
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...updates,
      }))
    }
  }, [
    areClose,
    formData.couponDiscountTotal,
    formData.manualDiscountTotal,
    formData.subtotalPrice,
    formData.totalDiscounts,
    formData.totalPrice,
    formData.totalTax,
    couponDiscountRounded,
    manualSafe,
    subtotalBefore,
    totalDiscountRaw,
    taxAmount,
    totalRounded,
    setFormData,
  ])

  const availableCurrencies = useMemo(() => {
    if (!shopSettings || shopSettings.length === 0) {
      return currencies.filter((currency) => currency.isActive)
    }

    const currentShop = shopSettings[0]

    if (!currentShop.acceptedCurrencies || currentShop.acceptedCurrencies.length === 0) {
      return currencies.filter((currency) => currency.isActive)
    }

    return currencies.filter(
      (currency) => currency.isActive && currentShop.acceptedCurrencies?.some((accepted) => accepted.id === currency.id),
    )
  }, [currencies, shopSettings])

  useEffect(() => {
    if (!formData.currencyId && shopSettings && shopSettings.length > 0) {
      const defaultCurrencyId = shopSettings[0].defaultCurrencyId
      if (defaultCurrencyId) {
        setFormData((prev) => ({
          ...prev,
          currencyId: defaultCurrencyId,
        }))
      }
    }
  }, [formData.currencyId, setFormData, shopSettings])

  const handleCurrencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      currencyId: value,
    }))
  }


  const handleQuantityChange = (index: number, value: string) => {
    const quantity = Math.max(1, Math.floor(toNumber(value) || 0) || 1)
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => (i === index ? { ...item, quantity } : item)),
    }))
  }

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const handleCouponChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      couponId: value === "none" ? undefined : value,
    }))
  }

  const handleManualDiscountChange = (value: string) => {
    const numericValue = toNumber(value)
    const sanitized = clamp(numericValue, 0, maxManual)
    setFormData((prev) => ({
      ...prev,
      manualDiscountTotal: sanitized,
    }))
  }

  const handleDesiredTotalChange = (value: string) => {
    const numericValue = toNumber(value)
    if (!Number.isFinite(numericValue)) {
      return
    }

    const desiredTotal = numericValue
    const desiredSubtotal = desiredTotal / (1 + taxRate)
    const discountWithoutManual = lineDiscount + couponDiscountRounded
    const manualNeededRaw = subtotalBefore - discountWithoutManual - desiredSubtotal
    const clamped = clamp(manualNeededRaw, 0, maxManual)

    handleManualDiscountChange(clamped.toString())
  }

  const handleDesiredTotalInputChange = (value: string) => {
    setDesiredTotalInput(value)
  }

  const selectedCurrency = currencies.find((c) => c.id === formData.currencyId)

  return (
    <div className="space-y-6">
      <SectionErrorHint title="Esta sección necesita atención" messages={sectionErrors} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Productos y precios</h2>
        </div>
        <Badge variant="outline" className="border-border/40 bg-background/60 text-xs font-medium text-muted-foreground">
          Paso 1 de 4
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="orderNumber" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Número de Orden
          </Label>
          {isEditMode ? (
            <Input
              id="orderNumber"
              type="text"
              value={formData.orderNumber ? `#${formData.orderNumber}` : "—"}
              readOnly
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
          ) : (
            <Input
              id="orderNumber"
              type="number"
              min={1}
              value={formData.orderNumber ?? ""}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") {
                  setFormData((prev) => ({ ...prev, orderNumber: 0 }))
                  return
                }
                const n = Number.parseInt(raw, 10)
                setFormData((prev) => ({
                  ...prev,
                  orderNumber: Number.isFinite(n) && n >= 1 ? n : prev.orderNumber ?? 1000,
                }))
              }}
              className="bg-background"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? "El número de orden no se puede modificar al editar."
              : "Puedes editarlo antes de crear el pedido. Por defecto se asigna el siguiente disponible."}
          </p>
        </div>
        <div className="space-y-3">
          <Label htmlFor="currency" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Moneda <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.currencyId} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency" className="bg-background">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.length > 0 ? (
                availableCurrencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.code})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-currencies" disabled>
                  No hay monedas disponibles
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {!formData.currencyId && (
            <p className="text-xs text-amber-600">La moneda es obligatoria para crear el pedido</p>
          )}
          {availableCurrencies.length === 0 && (
            <p className="text-xs text-red-600">No hay monedas configuradas para esta tienda</p>
          )}
        </div>
      </div>

      {/* Campo de fecha de creación manual */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <Label htmlFor="custom-created-at" className="text-sm font-medium text-foreground cursor-pointer">
                Activar fecha de creación manual
              </Label>
              <p className="text-xs text-muted-foreground">
                Si no se activa, se mantendrá la fecha y hora de creación original
              </p>
            </div>
          </div>
          <Switch
            id="custom-created-at"
            checked={!!formData.useCustomCreatedAt}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                useCustomCreatedAt: checked,
                createdAt: checked ? (prev.createdAt || new Date()) : undefined,
              }))
            }}
          />
        </div>
        {formData.useCustomCreatedAt && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/30 bg-background p-4">
              <DateTimePicker
                date={formData.createdAt}
                setDate={(date) => {
                  setFormData((prev) => ({ ...prev, createdAt: date }))
                }}
              />
            </div>
            {isEditMode && (
              <Alert className="border-amber-200/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Al establecer una fecha manual, se perderá permanentemente la fecha de creación original del pedido.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Información sobre impuestos */}

      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Productos</h3>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPOSDialogOpen(true)}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <ScanLine className="mr-2 h-4 w-4" />
              POS
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductDialogOpen(true)}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir productos
            </Button>
          </div>
        </div>

        {formData.lineItems.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border/30">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[120px] text-right">Precio</TableHead>
                  <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                  <TableHead className="w-[120px] text-right">Total</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/10">
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-right">
                      {selectedCurrency?.symbol || ""}
                      {Number(item.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="mx-auto w-16 bg-background text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {selectedCurrency?.symbol || ""}
                      {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/40 bg-muted/20 py-12 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="mb-4 text-sm text-muted-foreground">No hay productos en el pedido</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductDialogOpen(true)}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir productos
            </Button>
            <p className="text-xs text-amber-600 mt-4">Debe añadir al menos un producto para crear el pedido</p>
          </div>
        )}
      </div>

      <Collapsible
        open={isDiscountSectionOpen}
        onOpenChange={setIsDiscountSectionOpen}
        className="mt-6 rounded-lg border border-border/30 bg-muted/10 p-4"
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex w-full items-center justify-between border-border/40 bg-background text-sm font-medium text-muted-foreground hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Opciones de descuento
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDiscountSectionOpen ? "rotate-180" : "rotate-0"}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="coupon" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Cupón
              </Label>
              <Select value={formData.couponId || "none"} onValueChange={handleCouponChange}>
                <SelectTrigger id="coupon" className="bg-background">
                  <SelectValue placeholder="Sin cupón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cupón</SelectItem>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.code} ({coupon.type === DiscountType.PERCENTAGE ? `${coupon.value}%` : `${coupon.value}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {couponEvaluation.message && (
                <p className={`text-xs ${couponEvaluation.isValid ? "text-emerald-600" : "text-amber-600"}`}>
                  {couponEvaluation.message}
                </p>
              )}
              {couponEvaluation.isValid && (
                <p className="text-xs text-emerald-600">
                  Descuento aplicado: -
                  {selectedCurrency?.symbol || ""}
                  {couponDiscountRounded.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="manual-discount" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Descuento manual
              </Label>
              <Input
                id="manual-discount"
                type="number"
                step="any"
                min="0"
                max={maxManual}
                value={Number.isFinite(manualSafe) ? manualSafe.toString() : ""}
                onChange={(e) => handleManualDiscountChange(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Máximo disponible: {selectedCurrency?.symbol || ""}
                {maxManualRounded.toFixed(2)}
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="desired-total" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Total deseado
              </Label>
              <Input
                id="desired-total"
                type="number"
                step="0.01"
                min="0"
                value={desiredTotalInput}
                onFocus={() => setIsEditingTotal(true)}
                onBlur={(e) => {
                  setIsEditingTotal(false)
                  handleDesiredTotalChange(e.target.value)
                }}
                onChange={(e) => handleDesiredTotalInputChange(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Ajusta el total y calculamos el descuento manual necesario.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-6 border-t border-border/20 pt-6">
        <div className="rounded-lg border border-border/30 bg-muted/10 p-5">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center font-medium text-foreground">
                      {selectedCurrency?.symbol || ""}
                      {subtotalBeforeRounded.toFixed(2)}
                      <InfoIcon className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {taxesIncluded
                        ? "Subtotal neto sin impuestos (extraídos del precio con impuestos)"
                        : "Suma de precios antes de impuestos"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos ({(taxRate * 100).toFixed(2)}%)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center font-medium text-foreground">
                      {selectedCurrency?.symbol || ""}
                      {taxRounded.toFixed(2)}
                      <InfoIcon className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {taxesIncluded
                        ? `Se recalcula tras los descuentos aplicados sobre ${subtotalAfterDiscountRounded.toFixed(2)}`
                        : `Aplicado sobre el subtotal después de descuentos (${subtotalAfterDiscountRounded.toFixed(2)})`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-between text-sm font-medium text-destructive">
              <span>Total descuentos</span>
              <span>
                -{selectedCurrency?.symbol || ""}
                {totalDiscountRounded.toFixed(2)}
              </span>
            </div>

            <div className="mt-3 border-t border-border/20 pt-3">
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-primary">
                  {selectedCurrency?.symbol || ""}
                  {totalRounded.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
