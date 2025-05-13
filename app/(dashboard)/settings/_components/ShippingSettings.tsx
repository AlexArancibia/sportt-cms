"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { 
  CreateShippingMethodDto, 
  ShippingMethod, 
  ShippingMethodPriceInput 
} from "@/types/shippingMethod"
import { Currency } from "@/types/currency"

interface ShippingSettingsProps {
  shippingMethods: ShippingMethod[]
  shopSettings: any
}

interface FormPrice {
  currencyId: string;
  price: number;
  id?: string; // Para precios existentes
}

export default function ShippingSettings({ shippingMethods, shopSettings }: ShippingSettingsProps) {
  const { createShippingMethod, updateShippingMethod, deleteShippingMethod } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
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

  // DEBUG: Imprimir shopSettings al cargar el componente
  useEffect(() => {
    console.log("=== DEBUG: ShopSettings ===");
    console.log("shopSettings:", shopSettings);
    console.log("shopSettings.acceptedCurrencies:", shopSettings?.acceptedCurrencies);
    console.log("shopSettings.defaultCurrency:", shopSettings?.defaultCurrency);
    console.log("=== END DEBUG ===");
  }, [shopSettings]);

  // DEBUG: Imprimir shippingMethods al cargar el componente
  useEffect(() => {
    console.log("=== DEBUG: ShippingMethods ===");
    console.log("shippingMethods:", shippingMethods);
    console.log("=== END DEBUG ===");
  }, [shippingMethods]);

  // Obtener las monedas aceptadas del shopSettings
  const acceptedCurrencies: Currency[] = shopSettings?.acceptedCurrencies || []
  const defaultCurrency: Currency | undefined = shopSettings?.defaultCurrency

  // DEBUG: Imprimir monedas aceptadas
  useEffect(() => {
    console.log("=== DEBUG: Currencies ===");
    console.log("acceptedCurrencies:", acceptedCurrencies);
    console.log("defaultCurrency:", defaultCurrency);
    console.log("=== END DEBUG ===");
  }, [acceptedCurrencies, defaultCurrency]);

  // Asegurarse de que haya al menos un precio para la moneda predeterminada
  useEffect(() => {
    if (defaultCurrency && formData.prices.length === 0) {
      console.log("DEBUG: Inicializando precio con moneda predeterminada:", defaultCurrency.id);
      setFormData((prev) => ({
        ...prev,
        prices: [{ currencyId: defaultCurrency.id, price: 0 }],
      }))
    }
  }, [defaultCurrency, formData.prices.length])

  // Filtrar métodos de envío por término de búsqueda
  const filteredMethods = shippingMethods.filter(
    (method) =>
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (method.description && method.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleOpenDialog = (method?: ShippingMethod) => {
    if (method) {
      console.log("DEBUG: Abriendo diálogo para editar método:", method.id);
      setEditingMethod(method)
      setFormData({
        name: method.name,
        description: method.description || "",
        estimatedDeliveryTime: method.estimatedDeliveryTime || "",
        isActive: method.isActive,
        prices: method.prices.map(p => ({
          currencyId: p.currencyId,
          price: typeof p.price === 'number' ? p.price : Number(p.price),
          id: p.id
        })),
      })
      console.log("DEBUG: FormData inicializado para edición:", {
        name: method.name,
        description: method.description || "",
        estimatedDeliveryTime: method.estimatedDeliveryTime || "",
        isActive: method.isActive,
        prices: method.prices.map(p => ({
          currencyId: p.currencyId,
          price: typeof p.price === 'number' ? p.price : Number(p.price),
          id: p.id
        })),
      });
    } else {
      console.log("DEBUG: Abriendo diálogo para crear nuevo método");
      setEditingMethod(null)
      const initialPrices = defaultCurrency ? [{ currencyId: defaultCurrency.id, price: 0 }] : [];
      setFormData({
        name: "",
        description: "",
        estimatedDeliveryTime: "",
        isActive: true,
        prices: initialPrices,
      })
      console.log("DEBUG: FormData inicializado para creación:", {
        name: "",
        description: "",
        estimatedDeliveryTime: "",
        isActive: true,
        prices: initialPrices,
      });
    }
    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "number" ? Number.parseFloat(value) : value;
    console.log(`DEBUG: Cambio en campo ${name}:`, newValue);
    setFormData({
      ...formData,
      [name]: newValue,
    })
  }

  const handlePriceChange = (index: number, value: number) => {
    console.log(`DEBUG: Cambio en precio[${index}]:`, value);
    const newPrices = [...formData.prices]
    newPrices[index] = { ...newPrices[index], price: value }
    setFormData({
      ...formData,
      prices: newPrices,
    })
  }

  const handleCurrencyChange = (index: number, currencyId: string) => {
    console.log(`DEBUG: Cambio en moneda[${index}]:`, currencyId);
    const newPrices = [...formData.prices]
    newPrices[index] = { ...newPrices[index], currencyId }
    setFormData({
      ...formData,
      prices: newPrices,
    })
  }

  const addPrice = () => {
    // Encontrar una moneda que no esté ya en la lista de precios
    const usedCurrencyIds = formData.prices.map((p) => p.currencyId)
    const availableCurrency = acceptedCurrencies.find((c) => !usedCurrencyIds.includes(c.id))

    if (availableCurrency) {
      console.log("DEBUG: Añadiendo precio para moneda:", availableCurrency.id);
      setFormData({
        ...formData,
        prices: [...formData.prices, { currencyId: availableCurrency.id, price: 0 }],
      })
    } else {
      console.log("DEBUG: No hay más monedas disponibles para añadir");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ya has añadido todas las monedas disponibles",
      })
    }
  }

  const removePrice = (index: number) => {
    if (formData.prices.length > 1) {
      console.log(`DEBUG: Eliminando precio[${index}]`);
      const newPrices = [...formData.prices]
      newPrices.splice(index, 1)
      setFormData({
        ...formData,
        prices: newPrices,
      })
    } else {
      console.log("DEBUG: No se puede eliminar el único precio");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe haber al menos un precio",
      })
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    console.log("DEBUG: Cambio en isActive:", checked);
    setFormData({
      ...formData,
      isActive: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar que hay al menos un precio
      if (formData.prices.length === 0) {
        console.error("DEBUG: Error - No hay precios definidos");
        throw new Error("Debe añadir al menos un precio")
      }

      // Preparar los datos según el DTO
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

      console.log("=== DEBUG: SUBMIT PAYLOAD ===");
      console.log("Payload:", JSON.stringify(methodData, null, 2));
      console.log("=== END DEBUG PAYLOAD ===");

      if (editingMethod) {
        // Para actualización, no necesitamos enviar el storeId
        const { storeId, ...updateData } = methodData;
        console.log(`DEBUG: Endpoint para actualización: PUT /api/shipping-methods/${editingMethod.id}`);
        console.log("DEBUG: Payload para actualización:", JSON.stringify(updateData, null, 2));
        
        await updateShippingMethod(editingMethod.id, updateData as any);
        console.log("DEBUG: Método de envío actualizado correctamente");
        
        toast({
          title: "Método de envío actualizado",
          description: "El método de envío ha sido actualizado correctamente",
        })
      } else {
        console.log("DEBUG: Endpoint para creación: POST /api/shipping-methods");
        console.log("DEBUG: Payload para creación:", JSON.stringify(methodData, null, 2));
        
        await createShippingMethod(methodData)
        console.log("DEBUG: Método de envío creado correctamente");
        
        toast({
          title: "Método de envío creado",
          description: "El método de envío ha sido creado correctamente",
        })
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("=== DEBUG: ERROR AL GUARDAR ===");
      console.error("Error al guardar el método de envío:", error);
      console.error("Mensaje de error:", error?.message);
      console.error("Respuesta del servidor:", error?.response?.data);
      console.error("Estado HTTP:", error?.response?.status);
      console.error("=== END DEBUG ERROR ===");
      
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
        console.log(`DEBUG: Endpoint para eliminación: DELETE /api/shipping-methods/${id}`);
        await deleteShippingMethod(id)
        console.log("DEBUG: Método de envío eliminado correctamente");
        
        toast({
          title: "Método de envío eliminado",
          description: "El método de envío ha sido eliminado correctamente",
        })
      } catch (error: any) {
        console.error("=== DEBUG: ERROR AL ELIMINAR ===");
        console.error("Error al eliminar el método de envío:", error);
        console.error("Mensaje de error:", error?.message);
        console.error("Respuesta del servidor:", error?.response?.data);
        console.error("Estado HTTP:", error?.response?.status);
        console.error("=== END DEBUG ERROR ===");
        
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

  // Función para obtener el nombre de la moneda
  const getCurrencyName = (currencyId: string): string => {
    const currency = acceptedCurrencies.find((c) => c.id === currencyId)
    return currency ? `${currency.name} (${currency.code})` : currencyId
  }

  // Función para obtener el precio principal (primera moneda)
  const getMainPrice = (method: ShippingMethod): string => {
    if (!method.prices || method.prices.length === 0) return "No definido"
    const price = method.prices[0]
    const currency = acceptedCurrencies.find((c) => c.id === price.currencyId)
    const priceValue = typeof price.price === 'number' ? price.price : Number(price.price)
    return `${priceValue.toFixed(2)} ${currency?.code || ""}`
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3 className="text-lg font-medium">Métodos de Envío</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar método de envío
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMethod ? "Editar método de envío" : "Agregar método de envío"}</DialogTitle>
                  <DialogDescription>
                    {editingMethod
                      ? "Modifica los detalles del método de envío"
                      : "Agrega un nuevo método de envío a tu tienda"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
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
                      <Input
                        id="description"
                        name="description"
                        placeholder="Entrega en 3-5 días hábiles"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedDeliveryTime">Tiempo estimado de entrega</Label>
                      <Input
                        id="estimatedDeliveryTime"
                        name="estimatedDeliveryTime"
                        placeholder="3-5 días"
                        value={formData.estimatedDeliveryTime}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Precios por moneda</Label>
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
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <Select
                              value={price.currencyId}
                              onValueChange={(value) => handleCurrencyChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona moneda" />
                              </SelectTrigger>
                              <SelectContent>
                                {acceptedCurrencies.map((currency) => (
                                  <SelectItem
                                    key={currency.id}
                                    value={currency.id}
                                    disabled={formData.prices.some(
                                      (p, i) => i !== index && p.currencyId === currency.id,
                                    )}
                                  >
                                    {currency.name} ({currency.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-5">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Precio"
                              value={price.price}
                              onChange={(e) => handlePriceChange(index, Number.parseFloat(e.target.value))}
                              required
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePrice(index)}
                              disabled={formData.prices.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                      <Label htmlFor="isActive">Activo</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="box-section justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar métodos de envío..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredMethods.length === 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <p className="text-muted-foreground">No hay métodos de envío configurados</p>
            </div>
          ) : (
            <div className="box-section p-0">
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
                  {filteredMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.description}</TableCell>
                      <TableCell>{getMainPrice(method)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {method.prices && method.prices.map((price) => (
                            <Badge key={price.currencyId} variant="outline" className="text-xs">
                              {getCurrencyName(price.currencyId)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{method.estimatedDeliveryTime || "No especificado"}</TableCell>
                      <TableCell>
                        {method.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(method)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(method.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
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

          {shopSettings && (
            <div className="box-section border-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Configuración general de envíos</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura las opciones generales de envío para tu tienda.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="freeShippingThreshold">Umbral para envío gratuito</Label>
                      <div className="flex items-center">
                        <span className="mr-2">{defaultCurrency?.symbol || "$"}</span>
                        <Input
                          id="freeShippingThreshold"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="100.00"
                          value={shopSettings.freeShippingThreshold || ""}
                          className="max-w-[200px]"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Los clientes obtendrán envío gratuito cuando su pedido supere este monto.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Zonas de envío</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura diferentes zonas de envío para aplicar tarifas específicas.
                  </p>
                  <Button variant="outline" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Configurar zonas de envío
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta funcionalidad estará disponible próximamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}