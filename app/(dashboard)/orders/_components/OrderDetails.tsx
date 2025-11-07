"use client"

import type React from "react"

import { memo, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, DollarSign, Tag, Hash, ShoppingCart, InfoIcon } from "lucide-react"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import type { Product } from "@/types/product"
import type { Currency } from "@/types/currency"
import type { Coupon } from "@/types/coupon"
import type { ShippingMethod } from "@/types/shippingMethod"
import type { ShopSettings } from "@/types/store"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OrderDetailsProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  products: Product[]
  currencies: Currency[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  shopSettings: ShopSettings[]
  setIsProductDialogOpen: (open: boolean) => void
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
}: OrderDetailsProps) {
  // Obtener la configuración de la tienda actual
  const currentShopSettings = useMemo(() => {
    return shopSettings && shopSettings.length > 0 ? shopSettings[0] : null
  }, [shopSettings])

  // Determinar si los impuestos están incluidos en los precios
  const taxesIncluded = useMemo(() => {
    return currentShopSettings?.taxesIncluded || false
  }, [currentShopSettings])

  // Obtener el valor del impuesto (como fracción decimal)
  const taxValue = useMemo(() => {
    if (currentShopSettings?.taxValue === undefined || currentShopSettings?.taxValue === null) {
      return 0
    }
    // Si el valor es mayor a 1, se interpreta como porcentaje (ej: 18 = 18%)
    // Si es menor o igual a 1, se usa directamente como multiplicador (ej: 0.18)
    return currentShopSettings.taxValue > 1 ? currentShopSettings.taxValue / 100 : currentShopSettings.taxValue
  }, [currentShopSettings])

  // Calcular totales con la lógica correcta de impuestos
  const totals = useMemo(() => {
    // Suma total de los precios de los productos * cantidad
    const grossTotal = formData.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Total de descuentos
    const totalDiscount = formData.lineItems.reduce((sum, item) => sum + (item.totalDiscount || 0), 0)

    let subtotal: number
    let taxAmount: number

    if (taxesIncluded) {
      // Si los impuestos están incluidos en el precio:
      // El impuesto es una fracción del total bruto
      taxAmount = grossTotal * (taxValue / (1 + taxValue))
      // El subtotal es el total bruto menos los impuestos
      subtotal = grossTotal - taxAmount
    } else {
      // Si los impuestos no están incluidos:
      // El subtotal es el total bruto
      subtotal = grossTotal
      // El impuesto es un porcentaje adicional sobre el subtotal
      taxAmount = subtotal * taxValue
    }

    // El total final es subtotal + impuestos - descuentos
    const total = subtotal + taxAmount - totalDiscount

    return {
      grossTotal,
      subtotal,
      totalDiscount,
      taxAmount,
      total,
    }
  }, [formData.lineItems, taxValue, taxesIncluded])

  // Filtrar las monedas según las aceptadas por la tienda
  const availableCurrencies = useMemo(() => {
    // Si no hay configuración de tienda, mostrar todas las monedas activas
    if (!shopSettings || shopSettings.length === 0) {
      return currencies.filter((currency) => currency.isActive)
    }

    const currentShop = shopSettings[0] // Usar la primera configuración de tienda

    // Si no hay monedas aceptadas definidas, mostrar todas las monedas activas
    if (!currentShop.acceptedCurrencies || currentShop.acceptedCurrencies.length === 0) {
      return currencies.filter((currency) => currency.isActive)
    }

    // Filtrar por monedas aceptadas y activas
    return currencies.filter(
      (currency) =>
        currency.isActive && currentShop.acceptedCurrencies?.some((accepted) => accepted.id === currency.id),
    )
  }, [currencies, shopSettings])

  // Establecer la moneda predeterminada al cargar el componente
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
  }, [formData.currencyId, shopSettings, setFormData])

  // Actualizar totales cuando cambien
  useEffect(() => {
    if (
      formData.subtotalPrice !== totals.subtotal ||
      formData.totalDiscounts !== totals.totalDiscount ||
      formData.totalTax !== totals.taxAmount ||
      formData.totalPrice !== totals.total
    ) {
      setFormData((prev) => ({
        ...prev,
        subtotalPrice: totals.subtotal,
        totalDiscounts: totals.totalDiscount,
        totalTax: totals.taxAmount,
        totalPrice: totals.total,
      }))
    }
  }, [totals, formData.subtotalPrice, formData.totalDiscounts, formData.totalTax, formData.totalPrice, setFormData])

  const handleCurrencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      currencyId: value,
    }))
  }

  const handleOrderNumberChange = (value: string) => {
    const numericValue = Number.parseInt(value, 10)
    if (!isNaN(numericValue)) {
      setFormData((prev) => ({
        ...prev,
        orderNumber: numericValue,
      }))
    }
  }

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = Number.parseInt(value) || 1
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

  const selectedCurrency = currencies.find((c) => c.id === formData.currencyId)

  return (
    <div className="space-y-6">
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
            Número de Orden <span className="text-red-500">*</span>
          </Label>
          <Input
            id="orderNumber"
            type="number"
            value={formData.orderNumber || ""}
            onChange={(e) => handleOrderNumberChange(e.target.value)}
            placeholder="Número de orden"
            className="bg-background"
          />
          {!formData.orderNumber && <p className="text-xs text-amber-600">El número de orden es obligatorio</p>}
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

      {/* Información sobre impuestos */}

      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Productos</h3>
          </div>
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

        {formData.lineItems.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border/30">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-[120px] text-right">Precio</TableHead>
                  <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                  <TableHead className="w-[120px] text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lineItems.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/10">
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-right">
                      {selectedCurrency?.symbol || ""}
                      {Number(item.price || 0).toFixed(2)}
                      {taxesIncluded && (
                        <span className="ml-1 text-xs text-muted-foreground/70">(con impuestos)</span>
                      )}
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
                      {Number(totals.subtotal || 0).toFixed(2)}
                      <InfoIcon className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {taxesIncluded ? "Precio total menos impuestos" : "Suma de precios sin impuestos"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos ({(taxValue * 100).toFixed(2)}%)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center font-medium text-foreground">
                      {selectedCurrency?.symbol || ""}
                      {Number(totals.taxAmount || 0).toFixed(2)}
                      <InfoIcon className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {taxesIncluded
                        ? `Calculado como parte del precio (${(taxValue * 100).toFixed(2)}% del total)`
                        : `Añadido al subtotal (${(taxValue * 100).toFixed(2)}% del subtotal)`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuentos</span>
              <span className="font-medium text-destructive">
                -{selectedCurrency?.symbol || ""}
                {Number(totals.totalDiscount || 0).toFixed(2)}
              </span>
            </div>

            <div className="mt-3 border-t border-border/20 pt-3">
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-primary">
                  {selectedCurrency?.symbol || ""}
                  {Number(totals.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
