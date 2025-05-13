"use client"

import type React from "react"

import { useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Pencil, Trash2, Loader2, CreditCard } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

interface PaymentSettingsProps {
  paymentProviders: any[]
  shopSettings: any
}

export default function PaymentSettings({ paymentProviders, shopSettings }: PaymentSettingsProps) {
  const { createPaymentProvider, updatePaymentProvider, deletePaymentProvider } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "stripe",
    description: "",
    isActive: true,
    credentials: "",
    testMode: true,
  })
  const { toast } = useToast()

  // Filtrar proveedores de pago por término de búsqueda
  const filteredProviders = paymentProviders.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenDialog = (provider?: any) => {
    if (provider) {
      setEditingProvider(provider)
      setFormData({
        name: provider.name,
        type: provider.type,
        description: provider.description || "",
        isActive: provider.isActive,
        credentials: provider.credentials || "",
        testMode: provider.testMode,
      })
    } else {
      setEditingProvider(null)
      setFormData({
        name: "",
        type: "stripe",
        description: "",
        isActive: true,
        credentials: "",
        testMode: true,
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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      type: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingProvider) {
        await updatePaymentProvider(editingProvider.id, formData)
        toast({
          title: "Proveedor de pago actualizado",
          description: "El proveedor de pago ha sido actualizado correctamente",
        })
      } else {
        await createPaymentProvider({
          ...formData,
          storeId: shopSettings?.storeId,
        })
        toast({
          title: "Proveedor de pago creado",
          description: "El proveedor de pago ha sido creado correctamente",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar el proveedor de pago:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el proveedor de pago. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este proveedor de pago?")) {
      setIsDeleting(true)
      try {
        await deletePaymentProvider(id)
        toast({
          title: "Proveedor de pago eliminado",
          description: "El proveedor de pago ha sido eliminado correctamente",
        })
      } catch (error) {
        console.error("Error al eliminar el proveedor de pago:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el proveedor de pago. Por favor, intente nuevamente.",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const getProviderTypeBadge = (type: string) => {
    switch (type) {
      case "stripe":
        return <Badge className="bg-purple-500">Stripe</Badge>
      case "paypal":
        return <Badge className="bg-blue-500">PayPal</Badge>
      case "mercadopago":
        return <Badge className="bg-sky-500">MercadoPago</Badge>
      case "bank_transfer":
        return <Badge variant="outline">Transferencia Bancaria</Badge>
      case "cash_on_delivery":
        return <Badge variant="outline">Contra Entrega</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3 className="text-lg font-medium">Proveedores de Pago</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar proveedor de pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProvider ? "Editar proveedor de pago" : "Agregar proveedor de pago"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProvider
                      ? "Modifica los detalles del proveedor de pago"
                      : "Agrega un nuevo proveedor de pago a tu tienda"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Stripe"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de proveedor</Label>
                      <Select value={formData.type} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="mercadopago">MercadoPago</SelectItem>
                          <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                          <SelectItem value="cash_on_delivery">Contra Entrega</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Paga con tarjeta de crédito o débito"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    {(formData.type === "stripe" || formData.type === "paypal" || formData.type === "mercadopago") && (
                      <div className="space-y-2">
                        <Label htmlFor="credentials">Credenciales (JSON)</Label>
                        <Textarea
                          id="credentials"
                          name="credentials"
                          placeholder='{"api_key": "sk_test_...", "public_key": "pk_test_..."}'
                          value={formData.credentials}
                          onChange={handleInputChange}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Ingresa las credenciales en formato JSON. Esta información es sensible y debe mantenerse
                          segura.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="testMode">Modo de prueba</Label>
                          <p className="text-xs text-muted-foreground">
                            Habilita el modo de prueba para realizar transacciones de prueba.
                          </p>
                        </div>
                        <Switch
                          id="testMode"
                          checked={formData.testMode}
                          onCheckedChange={(checked) => handleSwitchChange("testMode", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="isActive">Activo</Label>
                          <p className="text-xs text-muted-foreground">Habilita o deshabilita este método de pago.</p>
                        </div>
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                        />
                      </div>
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
                placeholder="Buscar proveedores de pago..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <p className="text-muted-foreground">No hay proveedores de pago configurados</p>
            </div>
          ) : (
            <div className="box-section p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {provider.name}
                        </div>
                      </TableCell>
                      <TableCell>{getProviderTypeBadge(provider.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{provider.description}</TableCell>
                      <TableCell>
                        {provider.testMode ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Pruebas
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            Producción
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(provider)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(provider.id)}
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

          <div className="box-section border-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Configuración general de pagos</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura las opciones generales de pago para tu tienda.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <Label>Captura automática de pagos</Label>
                      <p className="text-xs text-muted-foreground">
                        Captura automáticamente los pagos cuando se realiza un pedido.
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <Label>Notificaciones de pago</Label>
                      <p className="text-xs text-muted-foreground">
                        Envía notificaciones por correo electrónico cuando se recibe un pago.
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Seguridad de pagos</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura las opciones de seguridad para los pagos en tu tienda.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <Label>Verificación 3D Secure</Label>
                      <p className="text-xs text-muted-foreground">
                        Requiere verificación 3D Secure para pagos con tarjeta.
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <Label>Detección de fraude</Label>
                      <p className="text-xs text-muted-foreground">
                        Utiliza sistemas de detección de fraude para proteger tu tienda.
                      </p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
