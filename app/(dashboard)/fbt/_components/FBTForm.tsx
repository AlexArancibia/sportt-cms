"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import type { ProductVariant } from "@/types/productVariant"
import { FrequentlyBoughtTogether } from "@/types/fbt"

interface FBTFormProps {
  mode: "create" | "edit"
  initialData?: FrequentlyBoughtTogether | null
  onSubmit: (data: {
    name: string
    discountName?: string
    discount?: number
    variantIds: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function FBTForm({ mode, initialData, onSubmit, onCancel, isLoading = false }: FBTFormProps) {
  const { currentStore, fetchProductsByStore } = useMainStore()
  const { toast } = useToast()

  const [name, setName] = useState(initialData?.name || "")
  const [discountName, setDiscountName] = useState(initialData?.discountName || "")
  const [discount, setDiscount] = useState(initialData?.discount?.toString() || "")
  const [selectedVariants, setSelectedVariants] = useState<string[]>(initialData?.variants?.map((v) => v.id) || [])
  const [products, setProducts] = useState<any[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      if (!currentStore) return

      try {
        setIsLoadingData(true)
        const productsData = await fetchProductsByStore(currentStore)
        setProducts(productsData)

        // Extraer todas las variantes de los productos cargados
        const allVariants: ProductVariant[] = []
        productsData.forEach((product) => {
          if (product.variants && product.variants.length > 0) {
            allVariants.push(...product.variants)
          }
        })

        setVariants(allVariants)
      } catch (error) {
        console.error("Error loading products:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los productos",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadProducts()
  }, [currentStore, fetchProductsByStore, toast])

  // Actualizar el estado cuando cambian los datos iniciales (útil para edit)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDiscountName(initialData.discountName || "")
      setDiscount(initialData.discount?.toString() || "")
      setSelectedVariants(initialData.variants?.map((v) => v.id) || [])
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre del combo es obligatorio",
      })
      return
    }

    if (selectedVariants.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos 2 productos para el combo",
      })
      return
    }

    try {
      await onSubmit({
        name,
        discountName: discountName || undefined,
        discount: discount ? Number.parseFloat(discount) : undefined,
        variantIds: selectedVariants,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo ${mode === "create" ? "crear" : "actualizar"} el combo`,
      })
    }
  }

  const handleVariantToggle = (variantId: string) => {
    setSelectedVariants((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId],
    )
  }

  const getProductForVariant = (variantId: string) => {
    return products.find((product) => product.variants?.some((variant: { id: string }) => variant.id === variantId)) || null
  }

  const isFormLoading = isLoading || isLoadingData

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información del Combo</CardTitle>
          <CardDescription>Configura los detalles básicos del combo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Combo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Combo Desayuno Completo"
                required
                disabled={isFormLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountName">Nombre del Descuento (opcional)</Label>
              <Input
                id="discountName"
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                placeholder="Ej: Descuento Especial"
                disabled={isFormLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Descuento % (opcional)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Ej: 10"
                disabled={isFormLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selección de Productos</CardTitle>
          <CardDescription>Selecciona los productos que formarán parte del combo (mínimo 2)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-2 animate-pulse">
                  <div className="w-5 h-5 bg-muted rounded mr-3" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay productos disponibles. Crea productos primero.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {variants.map((variant) => {
                const product = getProductForVariant(variant.id)
                if (!product) return null

                return (
                  <div key={variant.id} className="flex items-center p-2 border rounded-md hover:bg-muted/50">
                    <Checkbox
                      id={variant.id}
                      checked={selectedVariants.includes(variant.id)}
                      onCheckedChange={() => handleVariantToggle(variant.id)}
                      className="mr-3"
                      disabled={isFormLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={variant.id} className="font-medium cursor-pointer">
                        {product.title}
                      </Label>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="truncate">{variant.title || "Variante principal"}</span>
                        {variant.sku && <span className="text-xs bg-muted px-1 rounded">SKU: {variant.sku}</span>}
                      </div>
                    </div>
                    {variant.prices && variant.prices[0] && (
                      <div className="text-right font-medium">
                        {formatCurrency(variant.prices[0].price, variant.prices[0].currency?.code || "USD")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {selectedVariants.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="font-medium">Productos seleccionados: {selectedVariants.length}</p>
              {selectedVariants.length < 2 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Selecciona al menos 2 productos para crear un combo
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isFormLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isFormLoading || selectedVariants.length < 2 || !name}>
            {mode === "create" ? "Crear Combo" : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
