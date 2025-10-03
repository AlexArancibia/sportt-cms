"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useApiError } from "@/hooks/use-api-error"
import { ProductSelectionDialog } from "./ProductSelectionDialog"
import { CustomerInfo } from "./CustomerInfo"
import { OrderDetails } from "./OrderDetails"
import { ShippingAndBilling } from "./ShippingAndBilling"
import { PaymentAndDiscounts } from "./PaymentAndDiscounts"
import { OrderStatus } from "./OrderStatus"
import { AdditionalInfo } from "./AdditionalInfo"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle2,
  Code,
  Copy,
  CreditCard,
  Database,
  Package,
  Save,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto } from "@/types/order"
import { OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"

interface OrderFormProps {
  orderId?: string
}

export function OrderForm({ orderId }: OrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { handleAnyError } = useApiError()
  const {
    createOrder,
    updateOrder,
    orders,
    products,
    fetchProductsByStore,
    currencies,
    fetchCurrencies,
    coupons,
    fetchCouponsByStore,
    paymentProviders,
    fetchPaymentProviders,
    shippingMethods,
    fetchShippingMethods,
    shopSettings,
    fetchShopSettingsByStore,
    currentStore,
    stores,
    fetchStores,
  } = useMainStore()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false)
  const [debugPayload, setDebugPayload] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [activeSection, setActiveSection] = useState<string>("products")
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(false)
  const [activeDevTab, setActiveDevTab] = useState<string>("payload")
  const [formSubmitAttempted, setFormSubmitAttempted] = useState<boolean>(false)

  const [formData, setFormData] = useState<CreateOrderDto & Partial<UpdateOrderDto>>({
    storeId: currentStore || "",
    orderNumber: generateOrderNumber(), // Ahora es un número
    customerInfo: {},
    currencyId: "",
    totalPrice: 0,
    subtotalPrice: 0,
    totalTax: 0,
    totalDiscounts: 0,
    lineItems: [],
    shippingAddress: {},
    billingAddress: {}, // Se copiará de shippingAddress por defecto
    couponId: undefined, // Cambiar null por undefined
    paymentProviderId: undefined, // Cambiar null por undefined
    shippingMethodId: undefined, // Cambiar null por undefined
    financialStatus: OrderFinancialStatus.PENDING,
    fulfillmentStatus: OrderFulfillmentStatus.UNFULFILLED,
    shippingStatus: ShippingStatus.PENDING,
    customerNotes: "",
    internalNotes: "",
    source: "web",
    preferredDeliveryDate: new Date(),
  })

  // Función para generar un número de orden único
  function generateOrderNumber() {
    // Si no hay pedidos, comenzar desde 1000
    if (!orders || orders.length === 0) {
      return 1000
    }

    // Extraer todos los números de orden y convertirlos a números
    const orderNumbers = orders.map((order) => {
      // Si el orderNumber es un string, intentar extraer el valor numérico
 
      // Si ya es un número, usarlo directamente
      return typeof order.orderNumber === "number" ? order.orderNumber : 0
    })

    // Encontrar el número más alto
    const highestNumber = Math.max(...orderNumbers)

    // Sumar 1 al número más alto
    return highestNumber + 1
  }

  // Log para depuración cuando formData cambia
  useEffect(() => {
    if (isInitialized) {
      console.log("[OrderForm] formData actualizado:", formData)
    }
  }, [formData, isInitialized])

  // Sincronizar la dirección de facturación con la de envío cuando cambia la dirección de envío
  useEffect(() => {
    if (formData.shippingAddress && Object.keys(formData.shippingAddress).length > 0) {
      setFormData((prev) => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress },
      }))
    }
  }, [formData.shippingAddress])

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("[OrderForm] Iniciando carga de datos...")
      setIsLoading(true)
      try {
        // Primero, asegurarse de que tenemos las tiendas cargadas
        if (stores.length === 0) {
          await fetchStores()
        }

        // Si no hay tienda seleccionada pero hay tiendas disponibles, seleccionar la primera
        const targetStoreId = currentStore || (stores.length > 0 ? stores[0].id : "")

        if (targetStoreId) {
          console.log(`[OrderForm] Cargando datos para la tienda: ${targetStoreId}`)

          // Cargar todos los datos necesarios en paralelo
          await Promise.all([
            fetchProductsByStore(targetStoreId),
            fetchCurrencies(),
            fetchCouponsByStore(targetStoreId),
            fetchPaymentProviders(),
            fetchShippingMethods(),
            fetchShopSettingsByStore(targetStoreId),
          ])

          console.log("[OrderForm] Datos base cargados correctamente")
        } else {
          console.warn("[OrderForm] No hay tienda seleccionada ni tiendas disponibles")
        }

        if (orderId) {
          console.log(`[OrderForm] Buscando orden con ID: ${orderId}`)
          const order = orders.find((o) => o.id === orderId)
          if (order) {
            console.log("[OrderForm] Orden encontrada:", order)
            // Convert Order to CreateOrderDto & Partial<UpdateOrderDto>
            // Handle nullable fields by converting them to undefined
            const convertedOrder: CreateOrderDto & Partial<UpdateOrderDto> = {
              storeId: order.storeId,
              orderNumber: order.orderNumber || generateOrderNumber(),
              customerInfo: order.customerInfo || {},
              currencyId: order.currencyId,
              totalPrice: order.totalPrice,
              subtotalPrice: order.subtotalPrice,
              totalTax: order.totalTax,
              totalDiscounts: order.totalDiscounts,
              lineItems:
                order.lineItems
                  ?.filter((item) => item.variantId !== undefined)
                  .map((item) => ({
                    variantId: item.variantId as string,
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    totalDiscount: item.totalDiscount || 0,
                  })) || [],
              shippingAddress: order.shippingAddress || {},
              billingAddress: order.billingAddress || order.shippingAddress || {},
              couponId: order.couponId || undefined, // Cambiar null por undefined
              paymentProviderId: order.paymentProviderId || undefined, // Cambiar null por undefined
              paymentStatus: order.paymentStatus || undefined,
              paymentDetails: order.paymentDetails || undefined,
              shippingMethodId: order.shippingMethodId || undefined, // Cambiar null por undefined
              shippingStatus: order.shippingStatus || ShippingStatus.PENDING,
              trackingNumber: order.trackingNumber || undefined,
              trackingUrl: order.trackingUrl || undefined,
              estimatedDeliveryDate: order.estimatedDeliveryDate || undefined,
              customerNotes: order.customerNotes || "",
              internalNotes: order.internalNotes || "",
              source: order.source || "web",
              preferredDeliveryDate: order.preferredDeliveryDate || new Date(),
              // Convert nullable enum values to undefined instead of null
              financialStatus: order.financialStatus || undefined,
              fulfillmentStatus: order.fulfillmentStatus || undefined,
            }
            console.log("[OrderForm] Orden convertida:", convertedOrder)
            setFormData(convertedOrder)
          } else {
            console.error("[OrderForm] No se encontró la orden con ID:", orderId)
          }
        } else {
          // Para nuevas órdenes, configurar con datos predeterminados
          const targetStore = currentStore || (stores.length > 0 ? stores[0].id : "")

          if (targetStore) {
            console.log("[OrderForm] Creando nueva orden para la tienda:", targetStore)

            // Obtener configuraciones de la tienda
            const settings = shopSettings.find((s) => s.storeId === targetStore)
            const storeData = stores.find((s) => s.id === targetStore)

            // Generar número de orden basado en el número más alto existente
            const newOrderNumber = generateOrderNumber()
            console.log("[OrderForm] Nuevo número de orden generado:", newOrderNumber)

            // Preparar datos iniciales con información de la tienda
            const initialShippingAddress = {
              name: settings?.name || storeData?.name || "",
              address1: settings?.address1 || "",
              address2: settings?.address2 || "",
              city: settings?.city || "",
              state: settings?.province || "",
              postalCode: settings?.zip || "",
              country: settings?.country || "",
              phone: settings?.phone || "",
            }

            const initialData = {
              storeId: targetStore,
              orderNumber: newOrderNumber,
              currencyId: settings?.defaultCurrencyId || "",
              // Quitar totalTax ya que se calculará automáticamente
              shippingAddress: initialShippingAddress,
              billingAddress: initialShippingAddress, // Usar la misma dirección para facturación
              couponId: undefined, // Cambiar null por undefined
              paymentProviderId: undefined, // Cambiar null por undefined
              shippingMethodId: undefined, // Cambiar null por undefined
            }

            setFormData((prev) => ({
              ...prev,
              ...initialData,
            }))
          }
        }
      } catch (error) {
        console.error("[OrderForm] Error al cargar datos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos necesarios. Por favor, inténtelo de nuevo.",
        })
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
        console.log("[OrderForm] Carga de datos finalizada")
      }
    }

    loadInitialData()
  }, []) // Dependencias vacías para que solo se ejecute una vez

  // Función para generar el JSON de depuración
  const generateDebugPayload = () => {
    if (orderId) {
      const updateData: UpdateOrderDto = {
        orderNumber: formData.orderNumber,
        customerInfo: formData.customerInfo,
        financialStatus: formData.financialStatus,
        fulfillmentStatus: formData.fulfillmentStatus,
        currencyId: formData.currencyId,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.billingAddress,
        couponId: formData.couponId,
        paymentProviderId: formData.paymentProviderId,
        shippingMethodId: formData.shippingMethodId,
        shippingStatus: formData.shippingStatus,
        customerNotes: formData.customerNotes,
        internalNotes: formData.internalNotes,
        preferredDeliveryDate: formData.preferredDeliveryDate,
        lineItems:
          formData.lineItems
            ?.filter((item) => item.variantId !== undefined && item.variantId !== null)
            .map((item) => ({
              ...item,
              variantId: item.variantId as string,
              // Asegurar que price sea un número
              price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
            })) || [],
      }
      return JSON.stringify(updateData, null, 2)
    } else {
      const createData: CreateOrderDto = {
        ...formData,
        storeId: currentStore || formData.storeId,
        orderNumber: formData.orderNumber,
        customerInfo: formData.customerInfo || {},
        shippingAddress: formData.shippingAddress || {},
        billingAddress: formData.billingAddress || formData.shippingAddress || {},
        // No modificar couponId, paymentProviderId, shippingMethodId ya que se pasan directamente
        lineItems:
          formData.lineItems
            ?.filter((item) => item.variantId !== undefined && item.variantId !== null)
            .map((item) => ({
              ...item,
              variantId: item.variantId as string,
              // Asegurar que price sea un número
              price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
            })) || [],
      }
      return JSON.stringify(createData, null, 2)
    }
  }

  // Actualizar el payload de depuración cuando cambie el formData
  useEffect(() => {
    if (isInitialized) {
      setDebugPayload(generateDebugPayload())
    }
  }, [formData, isInitialized, currentStore, orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[OrderForm] Iniciando envío del formulario...")
    setIsLoading(true)
    setFormSubmitAttempted(true)

    if (formData.lineItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe agregar al menos un producto al pedido.",
      })
      setIsLoading(false)
      return
    }

    if (!formData.currencyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar una moneda para el pedido.",
      })
      setIsLoading(false)
      return
    }

    if (!formData.orderNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de orden es obligatorio.",
      })
      setIsLoading(false)
      return
    }

    try {
      if (orderId) {
        const updateData: UpdateOrderDto = {
          orderNumber: formData.orderNumber,
          customerInfo: formData.customerInfo,
          financialStatus: formData.financialStatus,
          fulfillmentStatus: formData.fulfillmentStatus,
          currencyId: formData.currencyId,
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.billingAddress,
          couponId: formData.couponId,
          paymentProviderId: formData.paymentProviderId,
          shippingMethodId: formData.shippingMethodId,
          shippingStatus: formData.shippingStatus,
          customerNotes: formData.customerNotes,
          internalNotes: formData.internalNotes,
          preferredDeliveryDate: formData.preferredDeliveryDate,
          lineItems:
            formData.lineItems
              ?.filter((item) => item.variantId !== undefined && item.variantId !== null)
              .map((item) => ({
                ...item,
                variantId: item.variantId as string,
                // Asegurar que price sea un número
                price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
              })) || [],
        }
        console.log("[OrderForm] Actualizando orden con datos:", updateData)
        await updateOrder(orderId, updateData)
      } else {
        const createData: CreateOrderDto = {
          ...formData,
          storeId: currentStore || formData.storeId,
          orderNumber: formData.orderNumber,
          customerInfo: formData.customerInfo || {},
          shippingAddress: formData.shippingAddress || {},
          billingAddress: formData.billingAddress || formData.shippingAddress || {},
          // No modificar couponId, paymentProviderId, shippingMethodId ya que se pasan directamente
          lineItems:
            formData.lineItems
              ?.filter((item) => item.variantId !== undefined && item.variantId !== null)
              .map((item) => ({
                ...item,
                variantId: item.variantId as string,
                // Asegurar que price sea un número
                price: typeof item.price === "string" ? Number.parseFloat(item.price) : item.price,
              })) || [],
        }
        console.log("[OrderForm] Creando nueva orden con datos:", createData)
        await createOrder(createData)
      }
      toast({
        title: "Éxito",
        description: `Pedido ${orderId ? "actualizado" : "creado"} correctamente`,
      })
      router.push("/orders")
    } catch (error) {
      console.error("[OrderForm] Error al enviar formulario:", error)
      handleAnyError(error, {
        operation: `${orderId ? "actualizar" : "crear"} el pedido`,
        defaultMessage: `No se pudo ${orderId ? "actualizar" : "crear"} el pedido. Por favor, inténtelo de nuevo.`,
      })
    } finally {
      setIsLoading(false)
      console.log("[OrderForm] Envío del formulario finalizado")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(debugPayload)
    toast({
      title: "Copiado",
      description: "JSON copiado al portapapeles",
    })
  }

  // Verificar si hay datos obligatorios faltantes
  const missingRequiredData = !formData.currencyId || formData.lineItems.length === 0 || !formData.orderNumber

  // Función para verificar si una sección está completa
  const isSectionComplete = (section: string): boolean => {
    switch (section) {
      case "products":
        return formData.lineItems.length > 0 && !!formData.currencyId && !!formData.orderNumber
      case "customer":
        return !!(formData.customerInfo?.name && formData.customerInfo?.email)
      case "shipping":
        return !!(formData.shippingAddress?.name && formData.shippingAddress?.address1)
      case "payment":
        return !!formData.paymentProviderId
      default:
        return false
    }
  }

  // Obtener información de la tienda actual
  const currentStoreData = stores.find((s) => s.id === (currentStore || formData.storeId))
  const currentShopSettings = shopSettings.find((s) => s.storeId === (currentStore || formData.storeId))

  return (
    <div className="text-foreground bg-background min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[60px] border-b border-border bg-card px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">{orderId ? "Editar Pedido" : "Nuevo Pedido"}</h3>
          {orderId && <Badge variant="outline">ID: {orderId.substring(0, 8)}</Badge>}
          {currentStoreData && (
            <Badge variant="secondary" className="ml-2">
              Tienda: {currentStoreData.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDevPanelOpen(true)}
            className="border-border text-primary  hover:bg-primary/10"
            title="Ver JSON para desarrolladores"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSubmit}
            className="create-button bg-primary hover:bg-primary/90"
            disabled={isLoading || missingRequiredData}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Guardando..." : orderId ? "Actualizar Pedido" : "Crear Pedido"}
          </Button>
        </div>
      </header>

      {/* Solo mostrar la alerta cuando se intente enviar el formulario y falten datos */}
      {missingRequiredData && formSubmitAttempted && (
        <Alert className="mx-6 mt-4 border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Para crear un pedido, debe seleccionar al menos un producto, una moneda y proporcionar un número de orden.
          </AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto py-6 px-4">
        {/* Navegación de pasos */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max border rounded-lg bg-card shadow-sm">
            <button
              onClick={() => setActiveSection("products")}
              className={`flex items-center gap-2 px-4 py-3 border-r flex-1 min-w-[180px] transition-colors ${
                activeSection === "products"
                  ? "bg-primary/10 text-primary border-b-2 border-b-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div
                className={`rounded-full p-1.5 ${
                  isSectionComplete("products") ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {isSectionComplete("products") ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">1. Productos</div>
                <div className="text-xs text-muted-foreground">{formData.lineItems.length} productos seleccionados</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("customer")}
              className={`flex items-center gap-2 px-4 py-3 border-r flex-1 min-w-[180px] transition-colors ${
                activeSection === "customer"
                  ? "bg-primary/10 text-primary border-b-2 border-b-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div
                className={`rounded-full p-1.5 ${
                  isSectionComplete("customer") ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {isSectionComplete("customer") ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="font-medium">2. Cliente</div>
                <div className="text-xs text-muted-foreground">
                  {formData.customerInfo?.name ? formData.customerInfo.name : "Sin cliente"}
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("shipping")}
              className={`flex items-center gap-2 px-4 py-3 border-r flex-1 min-w-[180px] transition-colors ${
                activeSection === "shipping"
                  ? "bg-primary/10 text-primary border-b-2 border-b-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div
                className={`rounded-full p-1.5 ${
                  isSectionComplete("shipping") ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {isSectionComplete("shipping") ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="font-medium">3. Envío</div>
                <div className="text-xs text-muted-foreground">
                  {formData.shippingAddress?.address1 ? "Dirección completa" : "Sin dirección"}
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("payment")}
              className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[180px] transition-colors ${
                activeSection === "payment"
                  ? "bg-primary/10 text-primary border-b-2 border-b-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div
                className={`rounded-full p-1.5 ${
                  isSectionComplete("payment") ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {isSectionComplete("payment") ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">4. Pago</div>
                <div className="text-xs text-muted-foreground">
                  {formData.paymentProviderId ? "Método seleccionado" : "Sin método de pago"}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            {isInitialized ? (
              <>
                {activeSection === "products" && (
                  <div className="bg-card rounded-lg shadow-sm border p-6">
                    <OrderDetails
                      formData={formData}
                      setFormData={setFormData}
                      products={products}
                      currencies={currencies}
                      coupons={coupons}
                      shippingMethods={shippingMethods}
                      shopSettings={shopSettings}
                      setIsProductDialogOpen={setIsProductDialogOpen}
                    />
                  </div>
                )}

                {activeSection === "customer" && (
                  <div className="bg-card rounded-lg shadow-sm border p-6">
                    <CustomerInfo formData={formData} setFormData={setFormData} />
                  </div>
                )}

                {activeSection === "shipping" && (
                  <div className="bg-card rounded-lg shadow-sm border p-6">
                    <ShippingAndBilling formData={formData} setFormData={setFormData} />
                  </div>
                )}

                {activeSection === "payment" && (
                  <div className="space-y-6">
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                      <PaymentAndDiscounts
                        formData={formData}
                        setFormData={setFormData}
                        paymentProviders={paymentProviders}
                      />
                    </div>
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                      <OrderStatus formData={formData} setFormData={setFormData} />
                    </div>
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                      <AdditionalInfo formData={formData} setFormData={setFormData} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-40 bg-card rounded-lg shadow-sm border">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral con resumen */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary" />
                Resumen del Pedido
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Número de Orden:</span>
                  <span className="font-medium">{formData.orderNumber}</span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Productos:</span>
                  <span className="font-medium">{formData.lineItems.length}</span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.subtotalPrice || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Descuentos:</span>
                  <span className="font-medium text-destructive">
                    -{formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.totalDiscounts || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Impuestos (calculados automáticamente):</span>
                  <span className="font-medium">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.totalTax || 0).toFixed(2)}
                    {currentShopSettings?.taxValue !== null && currentShopSettings?.taxValue !== undefined && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (
                        {Number(currentShopSettings.taxValue) > 1
                          ? `${currentShopSettings.taxValue}%`
                          : `${currentShopSettings.taxValue * 100}%`}
                        )
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-2 text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-success">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Información del Cliente</h4>
                {formData.customerInfo?.name ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{formData.customerInfo.name}</p>
                    <p>{formData.customerInfo.email}</p>
                    <p>{formData.customerInfo.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay información del cliente</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Dirección de Envío</h4>
                {formData.shippingAddress?.address1 ? (
                  <div className="space-y-1 text-sm">
                    <p>{formData.shippingAddress.name}</p>
                    <p>{formData.shippingAddress.address1}</p>
                    {formData.shippingAddress.address2 && <p>{formData.shippingAddress.address2}</p>}
                    <p>
                      {formData.shippingAddress.city}, {formData.shippingAddress.state}{" "}
                      {formData.shippingAddress.postalCode}
                    </p>
                    <p>{formData.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay dirección de envío</p>
                )}
              </div>

              {/* Información de la tienda */}
              {currentStoreData && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Información de la Tienda</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{currentStoreData.name}</p>
                    {currentShopSettings?.email && <p>{currentShopSettings.email}</p>}
                    {currentShopSettings?.phone && <p>{currentShopSettings.phone}</p>}
                    {currentShopSettings?.address1 && (
                      <p>
                        {currentShopSettings.address1}
                        {currentShopSettings.city && `, ${currentShopSettings.city}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading || missingRequiredData}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Guardando..." : orderId ? "Actualizar Pedido" : "Crear Pedido"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductSelectionDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        products={products}
        selectedCurrency={formData.currencyId}
        onConfirm={(selections) => {
          console.log("[OrderForm] Productos seleccionados:", selections)
          // Create CreateOrderItemDto objects instead of OrderItem objects
          const newLineItems: CreateOrderItemDto[] = selections.map((selection) => {
            const product = products.find((p) => p.id === selection.productId)!
            const variant = selection.variantId
              ? product.variants.find((v) => v.id === selection.variantId)!
              : product.variants[0]

            // Asegurarse de que el precio sea un número
            const priceString = variant.prices.find((p) => p.currencyId === formData.currencyId)?.price || "0"
            const price = typeof priceString === "string" ? Number.parseFloat(priceString) : priceString

            return {
              variantId: variant.id,
              title: variant.title || product.title || "",
              price: price,
              quantity: 1,
              totalDiscount: 0,
            }
          })

          console.log("[OrderForm] Nuevos items de línea creados:", newLineItems)
          setFormData((prev) => ({
            ...prev,
            lineItems: newLineItems,
          }))
        }}
        currentLineItems={formData.lineItems.map((item) => {
          // Find the product that contains this variant
          const product = products.find((p) => p.variants.some((v) => v.id === item.variantId))
          return {
            productId: product?.id || "",
            variantId: item.variantId || null,
          }
        })}
      />

      {/* Panel de Desarrollador */}
      <Dialog open={isDevPanelOpen} onOpenChange={setIsDevPanelOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Panel de Desarrollador
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDevPanelOpen(false)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="payload" value={activeDevTab} onValueChange={setActiveDevTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="payload" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON del Formulario
              </TabsTrigger>
              <TabsTrigger value="store" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Estado del Store
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payload" className="flex flex-col h-[60vh]">
              <div className="flex items-center justify-end mb-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  Copiar JSON
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="bg-card text-card-foreground dark:bg-muted dark:text-muted-foreground p-4 rounded-md overflow-auto border">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{debugPayload}</pre>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Este JSON es el que se enviará al servidor al {orderId ? "actualizar" : "crear"} la orden.</p>
                <p>Puedes usarlo para pruebas en Postman o para depuración.</p>
              </div>
            </TabsContent>

            <TabsContent value="store" className="flex flex-col h-[60vh]">
              <div className="flex items-center justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const storeState = {
                      currentStore,
                      storesCount: stores.length,
                      productsCount: products.length,
                      currenciesCount: currencies.length,
                      couponsCount: coupons.length,
                      paymentProvidersCount: paymentProviders.length,
                      shippingMethodsCount: shippingMethods.length,
                      shopSettingsCount: shopSettings.length,
                      currentStoreData,
                      currentShopSettings,
                    }
                    navigator.clipboard.writeText(JSON.stringify(storeState, null, 2))
                    toast({
                      title: "Copiado",
                      description: "Estado del store copiado al portapapeles",
                    })
                  }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Estado
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="bg-card text-card-foreground p-4 rounded-md overflow-auto border">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Estado General</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Tienda Actual:</span> {currentStore || "No seleccionada"}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Tiendas Cargadas:</span> {stores.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Productos Cargados:</span> {products.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Monedas Cargadas:</span> {currencies.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Cupones Cargados:</span> {coupons.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Métodos de Pago:</span> {paymentProviders.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Métodos de Envío:</span> {shippingMethods.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Configuraciones:</span> {shopSettings.length}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Inicializado:</span> {isInitialized ? "Sí" : "No"}
                        </div>
                        <div className="bg-background p-3 rounded-md border">
                          <span className="font-medium">Cargando:</span> {isLoading ? "Sí" : "No"}
                        </div>
                      </div>
                    </div>

                    {currentStoreData && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Tienda Actual</h3>
                        <div className="bg-background p-4 rounded-md border">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="font-medium text-primary">ID:</p>
                              <p className="mt-1 text-sm">{currentStoreData.id}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Nombre:</p>
                              <p className="mt-1 text-sm">{currentStoreData.name}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Slug:</p>
                              <p className="mt-1 text-sm">{currentStoreData.slug}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Activa:</p>
                              <p className="mt-1 text-sm">{currentStoreData.isActive ? "Sí" : "No"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentShopSettings && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Configuración de Tienda</h3>
                        <div className="bg-background p-4 rounded-md border">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium text-primary">ID:</p>
                              <p className="mt-1 text-sm">{currentShopSettings.id}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Nombre:</p>
                              <p className="mt-1 text-sm">{currentShopSettings.name}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Dominio:</p>
                              <p className="mt-1 text-sm">{currentShopSettings.domain}</p>
                            </div>
                            <div>
                              <p className="font-medium text-primary">Moneda Predeterminada:</p>
                              <p className="mt-1 text-sm">{currentShopSettings.defaultCurrencyId}</p>
                            </div>

                            {/* Destacar la configuración de impuestos */}
                            <div className="col-span-2 bg-primary/5 p-3 rounded-md border border-primary/20">
                              <h4 className="font-semibold text-primary mb-2">Configuración de Impuestos</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="font-medium">Valor de Impuesto:</p>
                                  <p className="mt-1 text-sm font-semibold">
                                    {currentShopSettings.taxValue !== null && currentShopSettings.taxValue !== undefined
                                      ? Number(currentShopSettings.taxValue) > 1
                                        ? `${currentShopSettings.taxValue}% (porcentaje)`
                                        : `${currentShopSettings.taxValue} (multiplicador directo)`
                                      : "No definido"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="font-medium text-primary">Múltiples Monedas:</p>
                              <p className="mt-1 text-sm">
                                {currentShopSettings.multiCurrencyEnabled ? "Habilitado" : "Deshabilitado"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Diagnóstico</h3>
                      <div className="space-y-2">
                        {!currentStore && (
                          <Alert variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No hay tienda seleccionada actualmente</AlertDescription>
                          </Alert>
                        )}

                        {products.length === 0 && (
                          <Alert variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No hay productos cargados</AlertDescription>
                          </Alert>
                        )}

                        {currencies.length === 0 && (
                          <Alert variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No hay monedas cargadas</AlertDescription>
                          </Alert>
                        )}

                        {!formData.currencyId && (
                          <Alert variant="warning" className="text-sm bg-yellow-50 border-yellow-200 text-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No hay moneda seleccionada en el formulario</AlertDescription>
                          </Alert>
                        )}

                        {formData.lineItems.length === 0 && (
                          <Alert variant="warning" className="text-sm bg-yellow-50 border-yellow-200 text-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No hay productos seleccionados en el formulario</AlertDescription>
                          </Alert>
                        )}

                        {currentStore && products.length > 0 && currencies.length > 0 && (
                          <Alert variant="default" className="text-sm bg-green-50 border-green-200 text-green-800">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>El estado del store parece correcto</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Esta vista muestra el estado actual del store global y ayuda a diagnosticar problemas.</p>
                <p>Si faltan datos, verifica las llamadas a la API y la inicialización del store.</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
