"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  FileText,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { translateEnum } from "@/lib/translations"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generateInvoicePDF } from "@/lib/generateInvoice"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fetchOrderById, orders, currentStore, fetchStores, stores, deleteOrder, currencies, setCurrentStore } = useMainStore()
  const { user, currentStoreId: authCurrentStoreId } = useAuthStore()
  const ownerId = user?.id ?? null

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const orderId = params.id as string

  // Usar currentStoreId de authStore como fuente principal, con fallback a mainStore
  const targetStoreId = authCurrentStoreId || currentStore

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si no hay tiendas cargadas, cargarlas primero
        if (stores.length === 0) {
          if (!ownerId) {
            setIsLoading(false)
            return
          }
          await fetchStores(ownerId)
        }

        // Sincronizar mainStore con authStore si es necesario
        if (authCurrentStoreId && authCurrentStoreId !== currentStore) {
          setCurrentStore(authCurrentStoreId)
        }

        // Usar el storeId de authStore o mainStore
        const storeId = authCurrentStoreId || currentStore

        if (!storeId) {
          // Si aún no hay store, intentar usar el primero disponible
          const firstStore = stores.length > 0 ? stores[0].id : null
          if (firstStore) {
            setCurrentStore(firstStore)
            await fetchOrderById(firstStore, orderId)
            return
          }
          setError("No hay tienda seleccionada. Por favor, seleccione una tienda primero.")
          setIsLoading(false)
          return
        }

        // Buscar el pedido específico por ID
        await fetchOrderById(storeId, orderId)
      } catch (err: any) {
        console.error("Error al cargar datos:", err)
        if (err?.response?.status === 404) {
          setError(`No se encontró el pedido con ID: ${orderId}`)
        } else {
          setError("Error al cargar los datos del pedido. Por favor, inténtelo de nuevo.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orderId, targetStoreId, fetchOrderById, fetchStores, stores.length, ownerId, authCurrentStoreId, currentStore, setCurrentStore])

  // Obtener el pedido actual
  const order = orders.find((o) => o.id === orderId)

  // Obtener el nombre de la tienda actual para mostrarlo
  const currentStoreName = stores.find((store) => store.id === currentStore)?.name || "Tienda"

  // Obtener la moneda del pedido
  const currency = currencies.find((c) => c.id === order?.currencyId)

  // Manejar la eliminación del pedido
  const handleDeleteOrder = async () => {
    if (!orderId) return

    setIsDeleting(true)
    try {
      await deleteOrder(orderId)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente",
      })
      router.push("/orders")
    } catch (err) {
      console.error("Error al eliminar el pedido:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el pedido. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/orders")} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalles del Pedido</h1>
            <p className="text-muted-foreground">
              {currentStore ? `Tienda: ${currentStoreName}` : "Seleccione una tienda"}
            </p>
          </div>
        </div>

        {order && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <Button variant="default" onClick={() => router.push(`/orders/${orderId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="secondary" onClick={() => generateInvoicePDF({
              ...order,
              orderNumber: order.orderNumber.toString(),
              createdAt: order.createdAt.toISOString()
            }, currency)}>
              Crear Factura Electrónica
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando datos del pedido...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Volver a la lista de pedidos
            </Button>
          </div>
        </Alert>
      ) : order ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Información general del pedido */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Pedido #{order.orderNumber}
                  </CardTitle>
                  <CardDescription>Creado el {new Date(order.createdAt).toLocaleString()}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-sm">
                    ID: {order.id.substring(0, 8)}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge variant={(order.financialStatus?.toLowerCase() as any) || "default"}>
                      {translateEnum(order.financialStatus)}
                    </Badge>
                    <Badge variant={(order.fulfillmentStatus?.toLowerCase() as any) || "default"}>
                      {translateEnum(order.fulfillmentStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Productos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Productos
                  </h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-sm">Producto</th>
                          <th className="px-4 py-2 text-right font-medium text-sm">Precio</th>
                          <th className="px-4 py-2 text-center font-medium text-sm">Cantidad</th>
                          <th className="px-4 py-2 text-right font-medium text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.lineItems && order.lineItems.length > 0 ? (
                          order.lineItems.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3">{item.title}</td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(item.price, currency?.code || "USD")}
                              </td>
                              <td className="px-4 py-3 text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(item.price * item.quantity, currency?.code || "USD")}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground">
                              No hay productos en este pedido
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr className="border-t">
                          <td colSpan={3} className="px-4 py-2 text-right font-medium">
                            Subtotal:
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(order.subtotalPrice, currency?.code || "USD")}
                          </td>
                        </tr>
                        {order.totalDiscounts > 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right font-medium">
                              Descuentos:
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-red-600">
                              -{formatCurrency(order.totalDiscounts, currency?.code || "USD")}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right font-medium">
                            Impuestos:
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(order.totalTax, currency?.code || "USD")}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td colSpan={3} className="px-4 py-2 text-right font-medium text-lg">
                            Total:
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-lg text-primary">
                            {formatCurrency(order.totalPrice, currency?.code || "USD")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Información de envío y estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Estado del pedido */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Estado del Pedido
                    </h3>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado financiero:</span>
                        <Badge variant={(order.financialStatus?.toLowerCase() as any) || "default"}>
                          {translateEnum(order.financialStatus)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado de cumplimiento:</span>
                        <Badge variant={(order.fulfillmentStatus?.toLowerCase() as any) || "default"}>
                          {translateEnum(order.fulfillmentStatus)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado de envío:</span>
                        <Badge variant={(order.shippingStatus?.toLowerCase() as any) || "default"}>
                          {translateEnum(order.shippingStatus)}
                        </Badge>
                      </div>
                      {order.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Número de seguimiento:</span>
                          <span className="font-medium">{order.trackingNumber}</span>
                        </div>
                      )}
                      {order.trackingUrl && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">URL de seguimiento:</span>
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Ver seguimiento
                          </a>
                        </div>
                      )}
                      {order.estimatedDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entrega estimada:</span>
                          <span className="font-medium">
                            {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información de pago */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Información de Pago
                    </h3>
                    <div className="space-y-3 bg-muted/20 p-4 rounded-md">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método de pago:</span>
                        <span className="font-medium">{order.paymentProvider?.name || "No especificado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado de pago:</span>
                        <Badge variant={(order.paymentStatus?.toLowerCase() as any) || "default"}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Moneda:</span>
                        <span className="font-medium">
                          {currency?.name || "No especificada"} ({currency?.code || "?"})
                        </span>
                      </div>
                      {order.coupon && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cupón aplicado:</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {order.coupon.code}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {(order.customerNotes || order.internalNotes) && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Notas
                    </h3>
                    <div className="space-y-4">
                      {order.customerNotes && (
                        <div className="bg-muted/20 p-4 rounded-md">
                          <h4 className="font-medium mb-2">Notas del cliente:</h4>
                          <p className="text-muted-foreground">{order.customerNotes}</p>
                        </div>
                      )}
                      {order.internalNotes && (
                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                          <h4 className="font-medium mb-2 text-yellow-800">Notas internas:</h4>
                          <p className="text-yellow-700">{order.internalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del cliente y direcciones */}
          <div className="space-y-6">
            {/* Información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.customerInfo ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Nombre:</h4>
                      <p className="font-medium">{order.customerInfo.name || "No especificado"}</p>
                    </div>
                    {order.customerInfo.email && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Email:</h4>
                        <p>{order.customerInfo.email}</p>
                      </div>
                    )}
                    {order.customerInfo.phone && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Teléfono:</h4>
                        <p>{order.customerInfo.phone}</p>
                      </div>
                    )}
                    {order.customerInfo.company && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Empresa:</h4>
                        <p>{order.customerInfo.company}</p>
                      </div>
                    )}
                    {order.customerInfo.taxId && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">RUC/DNI:</h4>
                        <p>{order.customerInfo.taxId}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No hay información del cliente</div>
                )}
              </CardContent>
            </Card>

            {/* Dirección de envío */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 ? (
                  <div className="space-y-1">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                      {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && <p>Tel: {order.shippingAddress.phone}</p>}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No hay dirección de envío</div>
                )}
              </CardContent>
            </Card>

            {/* Dirección de facturación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Dirección de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.billingAddress && Object.keys(order.billingAddress).length > 0 ? (
                  <div className="space-y-1">
                    <p className="font-medium">{order.billingAddress.name}</p>
                    <p>{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                    <p>
                      {order.billingAddress.city}
                      {order.billingAddress.state && `, ${order.billingAddress.state}`}
                      {order.billingAddress.postalCode && ` ${order.billingAddress.postalCode}`}
                    </p>
                    <p>{order.billingAddress.country}</p>
                    {order.billingAddress.phone && <p>Tel: {order.billingAddress.phone}</p>}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No hay dirección de facturación</div>
                )}
              </CardContent>
            </Card>

            {/* Fechas importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de creación:</span>
                    <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  {order.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última actualización:</span>
                      <span className="font-medium">{new Date(order.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {order.preferredDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrega preferida:</span>
                      <span className="font-medium">{new Date(order.preferredDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrega estimada:</span>
                      <span className="font-medium">{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pedido no encontrado</AlertTitle>
          <AlertDescription>No se pudo encontrar el pedido con ID: {orderId}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/orders")}>
              Volver a la lista de pedidos
            </Button>
          </div>
        </Alert>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
