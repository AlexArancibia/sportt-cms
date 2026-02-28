"use client"

import type React from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { usePaymentProviderMutations } from "@/hooks/settings/usePaymentProviderMutations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageUploadZone } from "@/components/ui/image-upload-zone"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CreditCard,
  Shield,
  Settings,
  Zap,
  AlertTriangle,
  Coins,
  DollarSign,
} from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Enum para tipos de proveedores de pago
enum PaymentProviderType {
  PAYPAL = "PAYPAL",
  STRIPE = "STRIPE",
  MERCADOPAGO = "MERCADOPAGO",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  CULQI = "CULQI",
  IZIPAY = "IZIPAY",
  NIUBIZ = "NIUBIZ",
  OTHER = "OTHER"
}

interface PaymentSettingsProps {
  paymentProviders: any[]
  shopSettings: any
  currencies?: any[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export default function PaymentSettings({
  paymentProviders,
  shopSettings,
  currencies = [],
  canCreate: canCreatePayment,
  canUpdate: canUpdatePayment,
  canDelete: canDeletePayment,
}: PaymentSettingsProps) {
  const { currentStoreId } = useStores()
  const {
    createPaymentProvider,
    updatePaymentProvider,
    deletePaymentProvider,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePaymentProviderMutations(currentStoreId ?? null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: PaymentProviderType.STRIPE,
    description: "",
    isActive: true,
    credentials: "",
    minimumAmount: "",
    maximumAmount: "",
    testMode: false,
    imgUrl: "",
    currencyId: "",
  })
  const { toast } = useToast()

  // Obtener las monedas aceptadas y filtrar las que tienen ID válido
  const acceptedCurrencies = (shopSettings?.acceptedCurrencies || []).filter((currency: any) => currency?.id)

  // Obtener la moneda predeterminada para inicializar el formulario
  const getDefaultCurrencyId = () => {
    // Primero intentamos usar la moneda predeterminada de la tienda
    if (
      shopSettings?.defaultCurrencyId &&
      acceptedCurrencies.some((c: any) => c.id === shopSettings.defaultCurrencyId)
    ) {
      return shopSettings.defaultCurrencyId
    }

    // Si no hay moneda predeterminada, buscamos una moneda activa entre las aceptadas
    if (acceptedCurrencies.length > 0) {
      const activeCurrency = acceptedCurrencies.find((c: any) => c.isActive)
      if (activeCurrency?.id) return activeCurrency.id

      // Si no hay monedas activas, usamos la primera disponible
      return acceptedCurrencies[0]?.id || ""
    }

    return ""
  }

  const handleOpenDialog = (provider?: any) => {
    // Respetar permisos: editar requiere update, crear requiere create
    if (provider && !canUpdatePayment) return
    if (!provider && !canCreatePayment) return

    if (provider) {
      setEditingProvider(provider)
      setFormData({
        name: provider.name || "",
        type: provider.type || PaymentProviderType.STRIPE,
        description: provider.description || "",
        isActive: provider.isActive ?? true,
        credentials: provider.credentials ? JSON.stringify(provider.credentials, null, 2) : "",
        minimumAmount: provider.minimumAmount?.toString() || "",
        maximumAmount: provider.maximumAmount?.toString() || "",
        testMode: provider.testMode || false,
        imgUrl: provider.imgUrl || "",
        currencyId: provider.currencyId || getDefaultCurrencyId(),
      })
    } else {
      setEditingProvider(null)
      setFormData({
        name: "",
        type: PaymentProviderType.STRIPE,
        description: "",
        isActive: true,
        credentials: "",
        minimumAmount: "",
        maximumAmount: "",
        testMode: false,
        imgUrl: "",
        currencyId: getDefaultCurrencyId(),
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handlers para la imagen del proveedor
  const handleImageUpload = (fileUrl: string) => {
    setFormData({
      ...formData,
      imgUrl: fileUrl,
    })
    toast({
      title: "Imagen subida",
      description: "La imagen del proveedor se ha subido correctamente",
    })
  }

  const handleImageRemove = () => {
    setFormData({
      ...formData,
      imgUrl: "",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.currencyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona una moneda para el proveedor de pago.",
      })
      return
    }

    let credentialsJson = null
    if (formData.credentials) {
      try {
        credentialsJson = JSON.parse(formData.credentials)
      } catch {
        toast({
          variant: "destructive",
          title: "Error en las credenciales",
          description: "Las credenciales deben ser un JSON válido.",
        })
        return
      }
    }

    const submitData = {
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      isActive: formData.isActive,
      credentials: credentialsJson,
      minimumAmount: formData.minimumAmount ? Number.parseFloat(formData.minimumAmount) : null,
      maximumAmount: formData.maximumAmount ? Number.parseFloat(formData.maximumAmount) : null,
      testMode: formData.testMode,
      imgUrl: formData.imgUrl || null,
      currencyId: formData.currencyId,
    }

    const targetStoreId = editingProvider?.storeId ?? shopSettings?.storeId ?? currentStoreId
    if (!targetStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo determinar la tienda para guardar el proveedor de pago.",
      })
      return
    }

    try {
      if (editingProvider) {
        await updatePaymentProvider(editingProvider.id, submitData)
        toast({
          title: "Proveedor de pago actualizado",
          description: "El proveedor de pago ha sido actualizado correctamente",
        })
      } else {
        await createPaymentProvider(submitData)
        toast({
          title: "Proveedor de pago creado",
          description: "El proveedor de pago ha sido creado correctamente",
        })
      }
      setIsDialogOpen(false)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el proveedor de pago. Por favor, intente nuevamente.",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proveedor de pago?")) return
    try {
      await deletePaymentProvider(id)
      toast({
        title: "Proveedor de pago eliminado",
        description: "El proveedor de pago ha sido eliminado correctamente",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el proveedor de pago. Por favor, intente nuevamente.",
      })
    }
  }

  const getProviderTypeBadge = (type: string) => {
    switch (type) {
      case PaymentProviderType.STRIPE:
        return <Badge className="bg-purple-500 hover:bg-purple-600">Stripe</Badge>
      case PaymentProviderType.PAYPAL:
        return <Badge className="bg-blue-500 hover:bg-blue-600">PayPal</Badge>
      case PaymentProviderType.MERCADOPAGO:
        return <Badge className="bg-sky-500 hover:bg-sky-600">MercadoPago</Badge>
      case PaymentProviderType.BANK_TRANSFER:
        return (
          <Badge variant="outline" className="border-green-200 text-green-700">
            Transferencia Bancaria
          </Badge>
        )
      case PaymentProviderType.CASH_ON_DELIVERY:
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-700">
            Contra Entrega
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case PaymentProviderType.STRIPE:
      case PaymentProviderType.PAYPAL:
      case PaymentProviderType.MERCADOPAGO:
        return <CreditCard className="h-4 w-4 text-primary" />
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Obtener el nombre de la moneda por ID
  const getCurrencyName = (currencyId: string) => {
    if (!currencies) return "Desconocida"
    const currency = currencies.find((c: any) => c.id === currencyId)
    return currency ? `${currency.name} (${currency.code})` : "Desconocida"
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Configuración de Pagos
          </h2>
          <p className="text-muted-foreground">Gestiona los métodos de pago disponibles en tu tienda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              size="lg"
              disabled={!canCreatePayment}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {editingProvider ? "Editar proveedor de pago" : "Agregar proveedor de pago"}
              </DialogTitle>
              <DialogDescription>
                {editingProvider
                  ? "Modifica los detalles del proveedor de pago"
                  : "Agrega un nuevo proveedor de pago a tu tienda"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del proveedor</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej: Stripe Checkout"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de proveedor</Label>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentProviderType.STRIPE}>Stripe</SelectItem>
                        <SelectItem value={PaymentProviderType.PAYPAL}>PayPal</SelectItem>
                        <SelectItem value={PaymentProviderType.MERCADOPAGO}>MercadoPago</SelectItem>
                        <SelectItem value={PaymentProviderType.BANK_TRANSFER}>Transferencia Bancaria</SelectItem>
                        <SelectItem value={PaymentProviderType.CASH_ON_DELIVERY}>Contra Entrega</SelectItem>
                        <SelectItem value={PaymentProviderType.OTHER}>Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencyId" className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Moneda
                  </Label>
                  <Select
                    value={formData.currencyId}
                    onValueChange={(value) => handleSelectChange("currencyId", value)}
                    disabled={acceptedCurrencies.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedCurrencies.length > 0 ? (
                        acceptedCurrencies.map((currency: any) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id}
                            className={!currency.isActive ? "text-muted-foreground" : ""}
                          >
                            {currency.name} ({currency.code}) {currency.symbol}
                            {currency.id === shopSettings?.defaultCurrencyId && " - Predeterminada"}
                            {!currency.isActive && " - Inactiva"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-currencies" disabled>
                          No hay monedas aceptadas disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {acceptedCurrencies.length === 0 && (
                    <p className="text-xs text-destructive">
                      No hay monedas aceptadas configuradas. Debes configurar al menos una moneda aceptada en la
                      configuración de la tienda.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descripción que verán los clientes durante el checkout"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo del proveedor</Label>
                  <ImageUploadZone
                    currentImage={formData.imgUrl}
                    onImageUploaded={handleImageUpload}
                    onRemoveImage={handleImageRemove}
                     onError={(error) =>
                       toast({
                         variant: "destructive",
                         title: "Error al subir imagen",
                         description: error,
                       })
                     }
                    placeholder="Sube el logo del proveedor de pago"
                    variant="minimal"
                    maxFileSize={3}
                 
                    allowedTypes={["image/jpeg", "image/png", "image/webp", "image/svg+xml"]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: Logo cuadrado o rectangular, máximo 3MB. Formatos: JPG, PNG, WebP, SVG
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumAmount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Monto mínimo
                    </Label>
                    <Input
                      id="minimumAmount"
                      name="minimumAmount"
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={formData.minimumAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maximumAmount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-red-500" />
                      Monto máximo
                    </Label>
                    <Input
                      id="maximumAmount"
                      name="maximumAmount"
                      type="number"
                      placeholder="10000.00"
                      min="0"
                      step="0.01"
                      value={formData.maximumAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {(formData.type === PaymentProviderType.STRIPE ||
                  formData.type === PaymentProviderType.PAYPAL ||
                  formData.type === PaymentProviderType.MERCADOPAGO) && (
                  <div className="space-y-2">
                    <Label htmlFor="credentials" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Credenciales (JSON)
                    </Label>
                    <Textarea
                      id="credentials"
                      name="credentials"
                      placeholder='{"api_key": "sk_test_...", "public_key": "pk_test_..."}'
                      value={formData.credentials}
                      onChange={handleInputChange}
                      className="font-mono text-sm"
                      rows={4}
                    />
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Esta información es sensible y debe mantenerse segura. Asegúrate de usar las credenciales
                        correctas para el entorno seleccionado.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="testMode" className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Modo de prueba
                        </Label>
                        <p className="text-xs text-muted-foreground">Habilita para realizar transacciones de prueba</p>
                      </div>
                      <Switch
                        id="testMode"
                        checked={formData.testMode}
                        onCheckedChange={(checked) => handleSwitchChange("testMode", checked)}
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="isActive" className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-green-500" />
                          Estado activo
                        </Label>
                        <p className="text-xs text-muted-foreground">Habilita o deshabilita este método de pago</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                      />
                    </div>
                  </Card>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isCreating ||
                    isUpdating ||
                    !formData.currencyId ||
                    (editingProvider ? !canUpdatePayment : !canCreatePayment)
                  }
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {editingProvider ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Proveedores Configurados
          </CardTitle>
          <CardDescription>
            {paymentProviders.length} {paymentProviders.length === 1 ? "proveedor" : "proveedores"} de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted rounded-lg">
              <CreditCard className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No hay proveedores de pago configurados</p>
              <p className="text-sm text-muted-foreground">Agrega tu primer método de pago para comenzar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead>Límites</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentProviders.map((provider) => (
                    <TableRow key={provider.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {provider.imgUrl ? (
                            <img
                              src={provider.imgUrl || "/placeholder.svg"}
                              alt={provider.name}
                              className="h-6 w-6 rounded object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            getProviderIcon(provider.type)
                          )}
                          <span>{provider.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getProviderTypeBadge(provider.type)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {provider.description || "Sin descripción"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-sm">{getCurrencyName(provider.currencyId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {provider.minimumAmount || provider.maximumAmount ? (
                            <div className="space-y-1">
                              {provider.minimumAmount && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Min:</span>
                                  <span>{provider.minimumAmount}</span>
                                </div>
                              )}
                              {provider.maximumAmount && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Max:</span>
                                  <span>{provider.maximumAmount}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin límites</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.testMode ? (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Pruebas
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400"
                          >
                            Producción
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {provider.isActive ? (
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
                            onClick={() => handleOpenDialog(provider)}
                            disabled={!canUpdatePayment}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(provider.id)}
                            disabled={isDeleting || !canDeletePayment}
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
