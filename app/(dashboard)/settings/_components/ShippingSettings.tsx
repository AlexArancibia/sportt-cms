"use client"

import type React from "react"
import { useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Loader2, Truck, Clock, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface ShippingMethod {
  id: string
  storeId: string
  name: string
  description?: string | null
  prices: ShippingMethodPrice[]
  estimatedDeliveryTime?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface ShippingMethodPrice {
  id: string
  shippingMethodId: string
  currencyId: string
  price: number
  createdAt: Date
  updatedAt: Date
}

interface ShippingMethodPriceInput {
  currencyId: string
  price: number
}

interface CreateShippingMethodDto {
  storeId: string
  name: string
  description?: string
  estimatedDeliveryTime?: string
  isActive?: boolean
  prices: ShippingMethodPriceInput[]
}

interface ShippingSettingsProps {
  shippingMethods: ShippingMethod[]
  shopSettings: any
}

interface FormPrice {
  currencyId: string
  price: number
  id?: string
}

export default function ShippingSettings({ shippingMethods, shopSettings }: ShippingSettingsProps) {
  const { createShippingMethod, updateShippingMethod, deleteShippingMethod } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    estimatedDeliveryTime: string
    isActive: boolean
    prices: FormPrice[]
  }>({
    name: "",
    description: "",
    estimatedDeliveryTime: "",
    isActive: true,
    prices: [],
  })
  const { toast } = useToast()

  // Obtener las monedas aceptadas del shopSettings
  const acceptedCurrencies = (shopSettings?.acceptedCurrencies || []).filter((currency: any) => currency?.id)
  const defaultCurrency = shopSettings?.defaultCurrency

  const handleOpenDialog = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method)
      setFormData({
        name: method.name,
        description: method.description || "",
        estimatedDeliveryTime: method.estimatedDeliveryTime || "",
        isActive: method.isActive,
        prices: method.prices.map((p) => ({
          currencyId: p.currencyId,
          price: typeof p.price === "number" ? p.price : Number(p.price),
          id: p.id,
        })),
      })
    } else {
      setEditingMethod(null)
      const initialPrices = defaultCurrency ? [{ currencyId: defaultCurrency.id, price: 0 }] : []
      setFormData({
        name: "",
        description: "",
        estimatedDeliveryTime: "",
        isActive: true,
        prices: initialPrices,
      })
    }
    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handlePriceChange = (index: number, value: number) => {
    const newPrices = [...formData.prices]
    newPrices[index] = { ...newPrices[index], price: value }
    setFormData({
      ...formData,
      prices: newPrices,
    })
  }

  const handleCurrencyChange = (index: number, currencyId: string) => {
    const newPrices = [...formData.prices]
    newPrices[index] = { ...newPrices[index], currencyId }
    setFormData({
      ...formData,
      prices: newPrices,
    })
  }

  const addPrice = () => {
    const usedCurrencyIds = formData.prices.map((p) => p.currencyId)
    const availableCurrency = acceptedCurrencies.find((c: any) => !usedCurrencyIds.includes(c.id))

    if (availableCurrency) {
      setFormData({
        ...formData,
        prices: [...formData.prices, { currencyId: availableCurrency.id, price: 0 }],
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ya has añadido todas las monedas disponibles",
      })
    }
  }

  const removePrice = (index: number) => {
    if (formData.prices.length > 1) {
      const newPrices = [...formData.prices]
      newPrices.splice(index, 1)
      setFormData({
        ...formData,
        prices: newPrices,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe haber al menos un precio",
      })
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isActive: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formData.prices.length === 0) {
        throw new Error("Debe añadir al menos un precio")
      }

      const methodData: CreateShippingMethodDto = {
        storeId: shopSettings?.storeId,
        name: formData.name,
        description: formData.description || undefined,
        estimatedDeliveryTime: formData.estimatedDeliveryTime || undefined,
        isActive: formData.isActive,
        prices: formData.prices.map((p) => ({
          currencyId: p.currencyId,
          price: p.price,
        })),
      }

      if (editingMethod) {
        const { storeId, ...updateData } = methodData
        await updateShippingMethod(editingMethod.id, updateData as any)
        toast({
          title: "Método de envío actualizado",
          description: "El método de envío ha sido actualizado correctamente",
        })
      } else {
        await createShippingMethod(methodData)
        toast({
          title: "Método de envío creado",
          description: "El método de envío ha sido creado correctamente",
        })
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "No se pudo guardar el método de envío. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este método de envío?")) {
      setIsDeleting(true)
      try {
        await deleteShippingMethod(id)
        toast({
          title: "Método de envío eliminado",
          description: "El método de envío ha sido eliminado correctamente",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el método de envío. Por favor, intente nuevamente.",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const getCurrencyName = (currencyId: string): string => {
    const currency = acceptedCurrencies.find((c: any) => c.id === currencyId)
    return currency ? `${currency.name} (${currency.code})` : currencyId
  }

  const getMainPrice = (method: ShippingMethod): string => {
    if (!method.prices || method.prices.length === 0) return "No definido"
    const price = method.prices[0]
    const currency = acceptedCurrencies.find((c: any) => c.id === price.currencyId)
    const priceValue = typeof price.price === "number" ? price.price : Number(price.price)
    return `${priceValue.toFixed(2)} ${currency?.code || ""}`
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Métodos de Envío
          </h2>
          <p className="text-muted-foreground">Gestiona los métodos de envío disponibles en tu tienda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {editingMethod ? "Editar método de envío" : "Agregar método de envío"}
              </DialogTitle>
              <DialogDescription>
                {editingMethod
                  ? "Modifica los detalles del método de envío"
                  : "Agrega un nuevo método de envío a tu tienda"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Envío estándar"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Entrega en 3-5 días hábiles"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Tiempo estimado de entrega
                  </Label>
                  <Input
                    id="estimatedDeliveryTime"
                    name="estimatedDeliveryTime"
                    placeholder="3-5 días hábiles"
                    value={formData.estimatedDeliveryTime}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Precios por moneda
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPrice}
                      disabled={formData.prices.length >= acceptedCurrencies.length}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Añadir precio
                    </Button>
                  </div>

                  {formData.prices.map((price, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6">
                          <Label className="text-sm">Moneda</Label>
                          <Select
                            value={price.currencyId}
                            onValueChange={(value) => handleCurrencyChange(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona moneda" />
                            </SelectTrigger>
                            <SelectContent>
                              {acceptedCurrencies.map((currency: any) => (
                                <SelectItem
                                  key={currency.id}
                                  value={currency.id}
                                  disabled={formData.prices.some((p, i) => i !== index && p.currencyId === currency.id)}
                                >
                                  {currency.name} ({currency.code}) {currency.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Label className="text-sm">Precio</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={price.price}
                            onChange={(e) => handlePriceChange(index, Number.parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="col-span-1 flex justify-center pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePrice(index)}
                            disabled={formData.prices.length <= 1}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {acceptedCurrencies.length === 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        No hay monedas aceptadas configuradas. Debes configurar al menos una moneda aceptada en la
                        configuración de la tienda.
                      </p>
                    </div>
                  )}
                </div>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-sm font-medium">
                        Estado activo
                      </Label>
                      <p className="text-xs text-muted-foreground">Habilita o deshabilita este método de envío</p>
                    </div>
                    <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                  </div>
                </Card>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || acceptedCurrencies.length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-2 h-4 w-4" />
                      {editingMethod ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de métodos de envío */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Métodos Configurados
          </CardTitle>
          <CardDescription>
            {shippingMethods.length} {shippingMethods.length === 1 ? "método" : "métodos"} de envío
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shippingMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted rounded-lg">
              <Truck className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No hay métodos de envío configurados</p>
              <p className="text-sm text-muted-foreground">Agrega tu primer método de envío para comenzar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Precio base</TableHead>
                    <TableHead>Monedas</TableHead>
                    <TableHead>Tiempo estimado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingMethods.map((method) => (
                    <TableRow key={method.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {method.description || "Sin descripción"}
                        </p>
                      </TableCell>
                      <TableCell>{getMainPrice(method)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {method.prices &&
                            method.prices.map((price) => (
                              <Badge key={price.currencyId} variant="outline" className="text-xs">
                                {getCurrencyName(price.currencyId)}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{method.estimatedDeliveryTime || "No especificado"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {method.isActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(method)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(method.id)}
                            disabled={isDeleting}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
