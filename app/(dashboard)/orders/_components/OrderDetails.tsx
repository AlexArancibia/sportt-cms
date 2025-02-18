"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CircleDollarSign, Plus, Settings, Trash2 } from "lucide-react"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import type { Product } from "@/types/product"
import type { Currency } from "@/types/currency"
import type { Coupon } from "@/types/coupon"
import type { ShippingMethod } from "@/types/shippingMethod"
import type { ShopSettings } from "@/types/shopSettings"

interface OrderDetailsProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  products: Product[]
  currencies: Currency[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  shopSettings: ShopSettings[]
  setIsProductDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

interface Totals {
  subtotal: number
  tax: number
  discount: number
  total: number
  shipmentCost: number
}

export function OrderDetails({
  formData,
  setFormData,
  products,
  currencies,
  coupons,
  shippingMethods,
  shopSettings,
  setIsProductDialogOpen,
}: OrderDetailsProps) {
  const [totals, setTotals] = useState<Totals>({ subtotal: 0, tax: 0, discount: 0, total: 0, shipmentCost: 0 })

  const calculateTotals = (): Totals => {
    let subtotal = formData.lineItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      const price = Number(item.price || getVariantPrice(variant, formData.currencyId) || 0);
      return total + price * item.quantity;
    }, 0);
  
    // taxRate ya está convertido a decimal (ej: 20% -> 0.20)
    const taxRate = shopSettings[0]?.taxValue ? shopSettings[0]?.taxValue / 100 : 0;
    let tax = 0;
    let total = subtotal;
    
  
    if (shopSettings[0]?.taxesIncluded) {
      // Corregido: Eliminar división por 100 adicional en la fórmula
      console.log("TAXES INCLUDED")
      tax = (subtotal ) * (taxRate);
      total = subtotal; // Restar el impuesto incluido para mantener el total correcto
      subtotal = subtotal-tax
    } else {
      console.log("TAXES NOT INCLUDED")
      tax = subtotal * taxRate;
      total = subtotal*(1+taxRate);
      console.log("SUBTOTALL: ",subtotal)
      console.log(total)
    }
  
    const discount = formData.totalDiscounts || 0;
    total -= discount;
  
    const shipmentMethod = shippingMethods.find((s) => s.id === formData.shippingMethodId);
    const shipmentCost = Number(
      shipmentMethod?.prices.find((p) => p.currencyId === formData.currencyId)?.price ?? 0
    );
    total += shipmentCost;
  
    return { subtotal, tax, discount, total, shipmentCost };
  };
  useEffect(() => {
    const newTotals = calculateTotals()
    setTotals(newTotals)
    setFormData((prev) => ({
      ...prev,
      totalPrice: newTotals.total,
      subtotalPrice: newTotals.subtotal,
      totalTax: newTotals.tax,
      totalDiscounts: newTotals.discount,
    }))
  }, [setFormData, formData.currencyId, formData.lineItems, formData.shippingMethodId, formData.couponId])

  const getVariantPrice = (variant: any, currencyId: string): number | undefined => {
    if (!variant) return undefined
    const price = variant.prices.find((p: { currencyId: string }) => p.currencyId === currencyId)
    return price ? price.price : undefined
  }

  const handleDeleteItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1 flex justify-between items-center container-section pb-0">
        <h4>Detalles del Pedido</h4>
        <div className="flex gap-2">
          <Select
            value={formData.currencyId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currencyId: value }))}
          >
            <SelectTrigger className="w-[70px] h-8 bg-background font-medium">
              <SelectValue
                placeholder={
                  <div className="flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                }
              />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="shadow-none h-8 px-2 text-sm"
            onClick={() => setIsProductDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Añadir Productos
          </Button>
        </div>
      </div>
      {formData.lineItems && formData.lineItems.length > 0 ? (
        <>
          <Table className="border-y">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Producto</TableHead>
 
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right w-[100px]">Cantidad</TableHead>
                <TableHead className="text-right pr-6">Total</TableHead>
                <TableHead className="text-right">
                  <Settings size={16} />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.lineItems.map((item, index) => {
                const product = products.find((p) => p.id === item.productId)
                const variant = product?.variants.find((v) => v.id === item.variantId)
                const price = item.price || getVariantPrice(variant, formData.currencyId) || 0
                const total = price * item.quantity

                return (
                  <TableRow key={index}>
                    <TableCell className="pl-6 ">
                      {product?.imageUrls && product.imageUrls.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                            alt={product?.title || "Product image"}
                            width={30}
                            height={30}
                            className="object-cover rounded"
                          />
                          <span>{variant?.title}</span>
                        </div>
                      ) : (
                        <span>{product?.title}</span>
                      )}
                    </TableCell>
 
                    <TableCell className="text-right">{price}</TableCell>
                    <TableCell className="w-[100px] flex justify-end items-center">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = Number.parseInt(e.target.value, 10)
                          if (!isNaN(newQuantity) && newQuantity >= 1) {
                            const updatedLineItems = [...formData.lineItems]
                            updatedLineItems[index].quantity = newQuantity
                            setFormData((prev) => ({
                              ...prev,
                              lineItems: updatedLineItems,
                            }))
                          }
                        }}
                        className="text-right h-7 max-w-[60px]"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6">{total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className=" text-red-600 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="space-y-1 text-sm px-6">
            <div className="flex justify-between">
              <Select
                value={formData.couponId}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, couponId: value }))
                }}
              >
                <SelectTrigger className="w-[230px] focus:ring-0 text-sky-600 h-6 p-0 bg-transparent border-none">
                  <SelectValue className="font-extralight" placeholder="Agregar cupón de descuento" />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>{totals.discount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-primary/80">Subtotal</span>
              <span className="font-light">{(totals.subtotal).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-primary/80">
              <Select
                value={formData.shippingMethodId}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, shippingMethodId: value }))
                }}
              >
                <SelectTrigger className="w-[230px] focus:ring-0 text-sky-600 h-6 p-0 bg-transparent border-none">
                  <SelectValue className=" " placeholder="Agregar metodo de envio" />
                </SelectTrigger>
                <SelectContent>
                  {shippingMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>{totals.shipmentCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary/80">Impuesto </span>
              <span>{totals.tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="text-primary/90">Total</span>
              <span>{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-12 flex justify-center items-center text-xs text-foreground">
          Sin productos encontrados.
        </div>
      )}
    </div>
  )
}

