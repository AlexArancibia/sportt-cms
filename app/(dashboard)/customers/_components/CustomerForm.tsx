"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@/types/customer"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  Trash2,
  MapPin,
  User,
  ShoppingBag,
  Mail,
  Phone,
  AlertCircle,
  Eye,
  Calendar,
  CreditCard,
  Package,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMainStore } from "@/stores/mainStore"
import { formatPrice } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit }) => {
  const { fetchOrders } = useMainStore()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [formData, setFormData] = useState<CreateCustomerDto | UpdateCustomerDto>({
    email: customer?.email || "",
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    phone: customer?.phone || "",
    password: "",
    acceptsMarketing: customer?.acceptsMarketing || false,
    addresses:
      customer?.addresses?.map((addr) => ({
        id: addr.id, // Importante: incluir el ID para las direcciones existentes
        isDefault: addr.isDefault || false,
        company: addr.company || "",
        address1: addr.address1,
        address2: addr.address2 || "",
        city: addr.city,
        province: addr.province || "",
        zip: addr.zip,
        country: addr.country,
        phone: addr.phone || "",
      })) || [],
  })

  // Cargar pedidos si existe el cliente
  useEffect(() => {
    const loadOrders = async () => {
      if (!customer) return

      setIsLoadingOrders(true)
      try {
        const allOrders = await fetchOrders()
        const customerOrders = allOrders.filter((order) => order.customerId === customer.id)
        // Ordenar por fecha, más reciente primero
        customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(customerOrders)
      } catch (error) {
        console.error("Error al cargar pedidos:", error)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    loadOrders()
  }, [customer, fetchOrders])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }, [])

  // Modificar la función handleAddressChange para que funcione correctamente con ambos tipos
  const handleAddressChange = (index: number, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses?.map((address, i) => (i === index ? { ...address, [field]: value } : address)) || [],
    }))
  }

  const handleAddAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...(prev.addresses || []),
        {
          // No incluimos un ID para las nuevas direcciones
          isDefault: false,
          company: "",
          address1: "",
          address2: "",
          city: "",
          province: "",
          zip: "",
          country: "",
          phone: "",
        },
      ],
    }))
  }

  // Modificar la parte donde se maneja la eliminación de direcciones
  const handleRemoveAddress = (index: number) => {
    setFormData((prev) => {
      // Si la dirección que se elimina es la predeterminada y hay más direcciones,
      // establecer la primera dirección restante como predeterminada
      const isRemovingDefault = prev.addresses?.[index]?.isDefault
      const newAddresses = prev.addresses?.filter((_, i) => i !== index) || []

      if (isRemovingDefault && newAddresses.length > 0) {
        newAddresses[0].isDefault = true
      }

      return {
        ...prev,
        addresses: newAddresses,
      }
    })
  }

  const validateForm = () => {
    // Validar que al menos una dirección sea predeterminada si hay direcciones
    if (formData.addresses && formData.addresses.length > 0) {
      const hasDefaultAddress = formData.addresses.some((addr) => addr.isDefault)
      if (!hasDefaultAddress) {
        toast({
          title: "Error de validación",
          description: "Debe establecer al menos una dirección como predeterminada",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  // Modificar la parte donde se preparan los datos para enviar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Preparar los datos para enviar al backend
    const dataToSubmit = { ...formData }

    onSubmit(dataToSubmit)
  }

  // Función para renderizar el estado financiero del pedido
  const renderFinancialStatus = (status?: string) => {
    if (!status) return <Badge variant="outline">Pendiente</Badge>

    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500">Pagado</Badge>
      case "refunded":
        return <Badge className="bg-orange-500">Reembolsado</Badge>
      case "partially_refunded":
        return <Badge className="bg-yellow-500">Reembolso parcial</Badge>
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Función para renderizar el estado de envío
  const renderShippingStatus = (status?: string) => {
    if (!status) return <Badge variant="outline">Pendiente</Badge>

    switch (status.toLowerCase()) {
      case "shipped":
        return <Badge className="bg-blue-500">Enviado</Badge>
      case "delivered":
        return <Badge className="bg-green-500">Entregado</Badge>
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Obtener el nombre completo del cliente
  const getCustomerFullName = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName} ${formData.lastName}`
    } else if (formData.firstName) {
      return formData.firstName
    } else if (formData.lastName) {
      return formData.lastName
    }
    return "Cliente"
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{customer ? `${getCustomerFullName()}` : "Nuevo Cliente"}</h1>
        <p className="text-muted-foreground">
          {customer ? "Gestiona la información y pedidos del cliente" : "Crea un nuevo cliente en el sistema"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Información</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Direcciones {formData.addresses?.length ? `(${formData.addresses.length})` : ""}</span>
          </TabsTrigger>
          {customer && (
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Pedidos {orders.length ? `(${orders.length})` : ""}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="email">Correo electrónico</Label>
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="phone">Teléfono</Label>
                      </div>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {!customer && (
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={(formData as CreateCustomerDto).password || ""}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
                  <Checkbox
                    id="acceptsMarketing"
                    name="acceptsMarketing"
                    checked={formData.acceptsMarketing}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptsMarketing: !!checked }))}
                  />
                  <div>
                    <Label htmlFor="acceptsMarketing">Acepta marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      El cliente acepta recibir correos electrónicos de marketing y promociones
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancelar
              </Button>
              <Button type="submit" form="customerForm">
                {customer ? "Actualizar Cliente" : "Crear Cliente"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Direcciones</CardTitle>
                <CardDescription>Gestiona las direcciones de envío y facturación del cliente</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddAddress} className="flex items-center gap-1">
                <PlusCircle className="w-4 h-4" />
                Añadir Dirección
              </Button>
            </CardHeader>
            <CardContent>
              {formData.addresses &&
                formData.addresses.length > 0 &&
                !formData.addresses.some((addr) => addr.isDefault) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Debe establecer al menos una dirección como predeterminada</AlertDescription>
                  </Alert>
                )}

              <div className="space-y-4">
                {formData.addresses?.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground">No hay direcciones registradas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.addresses?.map((address, index) => (
                      <Card key={index} className={`overflow-hidden ${address.isDefault ? "border-primary" : ""}`}>
                        <CardHeader className="bg-muted/30 py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {address.isDefault ? (
                                <Badge variant="default" className="bg-primary">
                                  Predeterminada
                                </Badge>
                              ) : (
                                <span>Dirección {index + 1}</span>
                              )}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAddress(index)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {address.company && <p className="text-sm font-medium">{address.company}</p>}
                            <p className="text-sm">{address.address1}</p>
                            {address.address2 && <p className="text-sm">{address.address2}</p>}
                            <p className="text-sm">
                              {address.city}, {address.province} {address.zip}
                            </p>
                            <p className="text-sm">{address.country}</p>
                            {address.phone && (
                              <p className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {address.phone}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center space-x-2">
                            <Checkbox
                              id={`isDefault-${index}`}
                              checked={address.isDefault}
                              onCheckedChange={(checked) => {
                                // Si se marca como predeterminada, desmarca las demás
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    addresses:
                                      prev.addresses?.map((addr, i) => ({
                                        ...addr,
                                        isDefault: i === index,
                                      })) || [],
                                  }))
                                } else {
                                  handleAddressChange(index, "isDefault", false)
                                }
                              }}
                            />
                            <Label htmlFor={`isDefault-${index}`}>Dirección predeterminada</Label>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() => {
                              // Abrir el modal de edición o cambiar a un modo de edición
                              // Por ahora, simplemente mostramos los campos de edición
                              setActiveTab("addresses-edit-" + index)
                            }}
                          >
                            Editar dirección
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="customerForm">
                {customer ? "Guardar Cambios" : "Crear Cliente"}
              </Button>
            </CardFooter>
          </Card>

          {formData.addresses?.map((address, index) => (
            <TabsContent key={index} value={`addresses-edit-${index}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => setActiveTab("addresses")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-chevron-left"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </Button>
                    Editar Dirección {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Empresa</Label>
                      <Input
                        placeholder="Empresa"
                        value={address.company || ""}
                        onChange={(e) => handleAddressChange(index, "company", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Dirección 1</Label>
                      <Input
                        placeholder="Dirección 1"
                        value={address.address1}
                        onChange={(e) => handleAddressChange(index, "address1", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label>Dirección 2</Label>
                      <Input
                        placeholder="Dirección 2"
                        value={address.address2 || ""}
                        onChange={(e) => handleAddressChange(index, "address2", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Ciudad</Label>
                      <Input
                        placeholder="Ciudad"
                        value={address.city}
                        onChange={(e) => handleAddressChange(index, "city", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label>Provincia</Label>
                      <Input
                        placeholder="Provincia"
                        value={address.province || ""}
                        onChange={(e) => handleAddressChange(index, "province", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Código Postal</Label>
                      <Input
                        placeholder="Código Postal"
                        value={address.zip}
                        onChange={(e) => handleAddressChange(index, "zip", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label>País</Label>
                      <Input
                        placeholder="País"
                        value={address.country}
                        onChange={(e) => handleAddressChange(index, "country", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        placeholder="Teléfono"
                        value={address.phone || ""}
                        onChange={(e) => handleAddressChange(index, "phone", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Checkbox
                      id={`isDefault-edit-${index}`}
                      checked={address.isDefault}
                      onCheckedChange={(checked) => {
                        // Si se marca como predeterminada, desmarca las demás
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            addresses:
                              prev.addresses?.map((addr, i) => ({
                                ...addr,
                                isDefault: i === index,
                              })) || [],
                          }))
                        } else {
                          handleAddressChange(index, "isDefault", false)
                        }
                      }}
                    />
                    <Label htmlFor={`isDefault-edit-${index}`}>Establecer como dirección predeterminada</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("addresses")}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveTab("addresses")
                      toast({
                        title: "Dirección actualizada",
                        description: "Los cambios se guardarán al actualizar el cliente",
                      })
                    }}
                  >
                    Guardar Dirección
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </TabsContent>

        {customer && (
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>Resumen de los pedidos realizados por este cliente</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">Cargando pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground">Este cliente no ha realizado ningún pedido</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          {/* Información principal del pedido */}
                          <div className="flex-1 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                Pedido #{order.orderNumber}
                              </h3>
                              <Badge
                                className={
                                  order.financialStatus?.toLowerCase() === "paid"
                                    ? "bg-green-500"
                                    : order.financialStatus?.toLowerCase() === "refunded"
                                      ? "bg-orange-500"
                                      : "bg-muted"
                                }
                              >
                                {order.financialStatus || "Pendiente"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Fecha:</span>
                              </div>
                              <div>
                                {new Date(order.createdAt).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </div>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>Total:</span>
                              </div>
                              <div className="font-medium">{formatPrice(order.totalPrice, order.currency.code)}</div>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Package className="h-3.5 w-3.5" />
                                <span>Envío:</span>
                              </div>
                              <div>{renderShippingStatus(order.shippingStatus)}</div>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Artículos:</span>
                              </div>
                              <div>
                                {order.lineItems.length} {order.lineItems.length === 1 ? "artículo" : "artículos"}
                              </div>
                            </div>

                            {/* Resumen de artículos */}
                            <div className="text-sm text-muted-foreground mb-3">
                              <span className="font-medium text-foreground">Productos: </span>
                              {order.lineItems.slice(0, 2).map((item, idx) => (
                                <span key={item.id}>
                                  {idx > 0 && ", "}
                                  {item.title} ({item.quantity})
                                </span>
                              ))}
                              {order.lineItems.length > 2 && <span> y {order.lineItems.length - 2} más</span>}
                            </div>
                          </div>

                          {/* Acciones del pedido */}
                          <div className="bg-muted/20 p-4 flex flex-row md:flex-col justify-between md:justify-center items-center gap-2 border-t md:border-t-0 md:border-l">
                            <Link href={`/orders/${order.id}/edit`} passHref>
                              <Button variant="default" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Pedido
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default CustomerForm

