"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { useStores } from "@/hooks/useStores"
import { useOrderById, fetchOrderById } from "@/hooks/useOrderById"
import { fetchNextOrderNumber } from "@/hooks/useOrders"
import { useOrderMutations } from "@/hooks/useOrderMutations"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useCoupons } from "@/hooks/useCoupons"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useShippingMethods } from "@/hooks/useShippingMethods"
import { usePaymentProviders } from "@/hooks/usePaymentProviders"
import { useAuthStore } from "@/stores/authStore"
import { generateStandardizedProductTitleFromObjects } from "@/lib/stringUtils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ProductSelectionDialog } from "./ProductSelectionDialog"
import { POSScannerDialog } from "./POSScannerDialog"
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
  ArrowLeft,
  CreditCard,
  Package,
  Save,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto, Order } from "@/types/order"
import { DiscountType, OrderFinancialStatus, OrderFulfillmentStatus, ShippingStatus } from "@/types/common"
import type { OrderFormLineItem, OrderFormState } from "./orderFormTypes"
import { mapOrderError, type OrderErrorFeedback, type OrderFormSectionKey } from "@/lib/orderErrorMapper"

interface OrderFormProps {
  orderId?: string
}

type StepId = "products" | "customer" | "shipping" | "payment"

interface StepItem {
  id: StepId
  label: string
  baseDescription: string
  hasError: boolean
  isComplete: boolean
  baseIcon: LucideIcon
}

export function OrderForm({ orderId }: OrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentStoreId, stores } = useStores()
  const { createOrder: createOrderMutation, updateOrder: updateOrderMutation } = useOrderMutations(currentStoreId)
  const { data: orderData } = useOrderById(currentStoreId, orderId ?? null, !!currentStoreId && !!orderId)
  const ordersFromRQ = orderId ? (orderData ? [orderData] : []) : []

  const currentStore = currentStoreId
  const targetStoreId = (currentStore || stores?.[0]?.id) ?? null

  const { data: currenciesData } = useCurrencies()
  const { data: couponsData, isLoading: isCouponsLoading } = useCoupons(targetStoreId, !!targetStoreId)
  const { data: shopSettingsData, isLoading: isShopSettingsLoading } = useShopSettings(targetStoreId)
  const { data: shippingMethodsData } = useShippingMethods(targetStoreId, !!targetStoreId)
  const { data: paymentProvidersData } = usePaymentProviders(targetStoreId, !!targetStoreId)

  const currencies = currenciesData ?? []
  const coupons = couponsData ?? []
  const shopSettings = shopSettingsData ? [shopSettingsData] : []
  const shippingMethods = shippingMethodsData ?? []
  const paymentProviders = paymentProvidersData ?? []
  const { user } = useAuthStore()
  const ownerId = user?.id ?? null

  const roundCurrency = (value: number): number =>
    Math.round((Number.isFinite(value) ? value : 0) * 100) / 100

  const toNumberSafe = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false)
  const [isPOSDialogOpen, setIsPOSDialogOpen] = useState<boolean>(false)
  const [debugPayload, setDebugPayload] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [activeSection, setActiveSection] = useState<StepId>("products")
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(false)
  const [formSubmitAttempted, setFormSubmitAttempted] = useState<boolean>(false)
  const [loadedStoreId, setLoadedStoreId] = useState<string | null>(null)
  const [initialOrderSnapshot, setInitialOrderSnapshot] = useState<UpdateOrderDto | null>(null)
  const [submissionError, setSubmissionError] = useState<OrderErrorFeedback | null>(null)

  const STEP_BUTTON_BASE =
    "flex min-w-[180px] flex-1 items-center gap-3 border-transparent px-5 py-3 text-left transition-all"
  const STEP_ICON_BASE = "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium"
  const SECTION_CARD_BASE = "rounded-lg border bg-card/80 p-5 shadow-sm transition"

  const getStepButtonClass = (hasError: boolean, isActive: boolean): string => {
    if (hasError) {
      return `${STEP_BUTTON_BASE} border border-destructive/30 bg-destructive/5 text-foreground`
    }
    if (isActive) {
      return `${STEP_BUTTON_BASE} border border-primary/20 bg-primary/5 text-primary`
    }
    return `${STEP_BUTTON_BASE} bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground`
  }

  const getStepIconClass = (hasError: boolean, isComplete: boolean): string => {
    if (hasError) {
      return `${STEP_ICON_BASE} border border-destructive/30 bg-destructive/10 text-destructive`
    }
    if (isComplete) {
      return `${STEP_ICON_BASE} bg-primary/10 text-primary`
    }
    return `${STEP_ICON_BASE} bg-muted/60 text-muted-foreground`
  }

  const getDescriptionClass = (hasError: boolean): string =>
    hasError ? "text-xs text-destructive/80" : "text-xs text-muted-foreground"

  const getSectionCardClass = (hasError: boolean): string =>
    `${SECTION_CARD_BASE} ${hasError ? "border-destructive/30 ring-1 ring-destructive/20" : "border-border/30"}`

  const [formData, setFormData] = useState<OrderFormState>({
    temporalOrderId: undefined,
    orderNumber: 1000, // Valor inicial, se actualizará cuando se carguen las órdenes
    customerInfo: {},
    currencyId: "",
    totalPrice: 0,
    subtotalPrice: 0,
    totalTax: 0,
    totalDiscounts: 0,
    manualDiscountTotal: 0,
    couponDiscountTotal: 0,
    lineItems: [],
    shippingAddress: {},
    billingAddress: {}, // Se copiará de shippingAddress por defecto
    couponId: undefined, // Cambiar null por undefined
    paymentProviderId: undefined, // Cambiar null por undefined
    paymentStatus: undefined,
    paymentDetails: undefined,
    shippingMethodId: undefined, // Cambiar null por undefined
    financialStatus: OrderFinancialStatus.PENDING,
    fulfillmentStatus: OrderFulfillmentStatus.UNFULFILLED,
    shippingStatus: ShippingStatus.PENDING,
    trackingNumber: undefined,
    trackingUrl: undefined,
    estimatedDeliveryDate: undefined,
    shippedAt: undefined,
    deliveredAt: undefined,
    customerNotes: "",
    internalNotes: "",
    source: "web",
    preferredDeliveryDate: new Date(),
  })

  // Helper function para consolidar productos duplicados
  const consolidateLineItems = (
    existingItems: OrderFormLineItem[],
    newItems: OrderFormLineItem[],
  ): OrderFormLineItem[] => {
    const variantMap = new Map<string, OrderFormLineItem>()
    
    // Mapear items existentes por variantId
    existingItems.forEach(item => {
      if (item.variantId) {
        variantMap.set(item.variantId as string, { ...item })
      }
    })
    
    // Procesar nuevos items
    newItems.forEach(newItem => {
      if (newItem.variantId) {
        const existingItem = variantMap.get(newItem.variantId as string)
        if (existingItem) {
          // Incrementar cantidad si ya existe
          existingItem.quantity += newItem.quantity
        } else {
          // Añadir como nuevo item
          variantMap.set(newItem.variantId as string, { ...newItem })
        }
      }
    })
    
    return Array.from(variantMap.values())
  }

  type PreparedLineItem = CreateOrderItemDto & {
    variantId?: string
    price: number
    totalDiscount: number
  }

  const prepareLineItemsForPayload = (items: OrderFormLineItem[] = []): PreparedLineItem[] => {
    return (
      items
        ?.filter((item) => item.variantId !== undefined && item.variantId !== null)
        .map((item) => {
          const { id: _ignoredId, ...rest } = item
          const numericPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : Number(item.price || 0)
          const numericDiscount = typeof item.totalDiscount === "string" ? Number.parseFloat(item.totalDiscount) : Number(item.totalDiscount || 0)
          const normalizedVariantId =
            item.variantId !== undefined && item.variantId !== null
              ? String(item.variantId)
              : undefined

          return {
            ...rest,
            ...(normalizedVariantId ? { variantId: normalizedVariantId } : {}),
            price: Number.isFinite(numericPrice) ? numericPrice : 0,
            totalDiscount: Number.isFinite(numericDiscount) ? numericDiscount : 0,
          }
        }) || []
    )
  }

  const sumLineItemDiscounts = (items: PreparedLineItem[]): number =>
    items.reduce((sum, item) => sum + (item.totalDiscount || 0), 0)

  const getTaxRateFromSettings = (settings: { taxValue?: number | null } | null): number => {
    const rawValue = toNumberSafe(settings?.taxValue ?? 0)
    return rawValue > 1 ? rawValue / 100 : rawValue
  }

  const calculateCouponDiscount = (
    couponId: string | undefined,
    couponList: Array<{ id: string; type: DiscountType; value?: number | null }>,
    subtotalBeforeDiscount: number,
    subtotalAfterLineItemDiscount: number,
  ): number => {
    if (!couponId) {
      return 0
    }

    const coupon = couponList.find((c) => c.id === couponId)
    if (!coupon) {
      return 0
    }

    const discountBase = subtotalBeforeDiscount
    const discountCapacity = Math.max(0, subtotalAfterLineItemDiscount)
    let discountAmount = 0

    switch (coupon.type) {
      case DiscountType.PERCENTAGE: {
        const percentage = toNumberSafe(coupon.value) / 100
        discountAmount = discountBase * percentage
        break
      }
      case DiscountType.FIXED_AMOUNT: {
        discountAmount = toNumberSafe(coupon.value)
        break
      }
      default:
        discountAmount = 0
    }

    const sanitized = Math.min(Math.max(0, discountAmount), discountCapacity)
    return roundCurrency(sanitized)
  }

  const calculateManualDiscount = (
    orderTotalDiscounts: unknown,
    lineItemDiscountTotal: number,
    couponDiscount: number,
  ): number => {
    const manualDiscount = Math.max(0, toNumberSafe(orderTotalDiscounts) - lineItemDiscountTotal - couponDiscount)
    return roundCurrency(manualDiscount)
  }

  const deriveExistingOrderDiscounts = (
    orderData: {
      lineItems: Array<{
        price: number | string
        quantity?: number | string | null
        totalDiscount?: number | string | null
      }>
      totalDiscounts: unknown
      couponId?: string
    },
    couponList: Array<{ id: string; type: DiscountType; value?: number | null }>,
    shopSettingsForOrder: { taxesIncluded?: boolean | null; taxValue?: number | null } | null,
  ): { manualDiscount: number; couponDiscount: number } => {
    const taxesIncluded = shopSettingsForOrder?.taxesIncluded ?? false
    const taxRateValue = getTaxRateFromSettings(shopSettingsForOrder)

    const lineItemDiscountTotal = orderData.lineItems.reduce((sum, item) => {
      return sum + toNumberSafe(item.totalDiscount ?? 0)
    }, 0)

    const grossTotal = orderData.lineItems.reduce((sum, item) => {
      const quantity = Math.max(0, toNumberSafe(item.quantity ?? 0))
      return sum + toNumberSafe(item.price) * quantity
    }, 0)

    const subtotalBeforeDiscount =
      taxesIncluded && taxRateValue > 0 ? grossTotal / (1 + taxRateValue) : grossTotal
    const subtotalAfterLineItemDiscount = Math.max(0, subtotalBeforeDiscount - lineItemDiscountTotal)

    const couponDiscount = calculateCouponDiscount(
      orderData.couponId,
      couponList,
      subtotalBeforeDiscount,
      subtotalAfterLineItemDiscount,
    )

    const manualDiscount = calculateManualDiscount(orderData.totalDiscounts, lineItemDiscountTotal, couponDiscount)

    return {
      manualDiscount,
      couponDiscount,
    }
  }

  const totalDiscountSummary = roundCurrency(formData.totalDiscounts || 0)

  const getSectionErrors = (section: OrderFormSectionKey): string[] =>
    submissionError?.sectionHints?.[section] ?? []

  const hasSectionError = (section: OrderFormSectionKey): boolean => getSectionErrors(section).length > 0

  const generalErrorHints = submissionError?.sectionHints?.general ?? []
  const detailMessages =
    submissionError && submissionError.technicalMessages.length > 0
      ? Array.from(new Set([...generalErrorHints, ...submissionError.technicalMessages]))
      : generalErrorHints

  useEffect(() => {
    setInitialOrderSnapshot(null)
  }, [orderId])

  const isDeepEqual = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) {
      return true
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
      return false
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }

      return a.every((item, index) => isDeepEqual(item, b[index]))
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false
    }

    const keysA = Object.keys(a as Record<string, unknown>)
    const keysB = Object.keys(b as Record<string, unknown>)

    if (keysA.length !== keysB.length) {
      return false
    }

    return keysA.every((key) => {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false
      }
      return isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    })
  }

  const sanitizeUpdatePayload = (payload: UpdateOrderDto): UpdateOrderDto => {
    const sanitized: Partial<UpdateOrderDto> = {}
    ;(Object.keys(payload) as Array<keyof UpdateOrderDto>).forEach((key) => {
      const value = payload[key]
      if (value !== undefined) {
        ;(sanitized as Record<string, unknown>)[key as string] = value
      }
    })
    return sanitized as UpdateOrderDto
  }

  const getAggregatedDiscounts = (
    formState: OrderFormState,
    preparedLineItems: PreparedLineItem[],
  ): number => {
    const lineItemDiscountTotal = sumLineItemDiscounts(preparedLineItems)
    return (
      lineItemDiscountTotal +
      (formState.manualDiscountTotal || 0) +
      (formState.couponDiscountTotal || 0)
    )
  }

  const buildUpdatePayload = (
    formState: OrderFormState,
    preparedLineItemsOverride?: PreparedLineItem[],
    aggregatedDiscountsOverride?: number,
  ): UpdateOrderDto => {
    const preparedLineItems = preparedLineItemsOverride ?? prepareLineItemsForPayload(formState.lineItems)
    const aggregatedDiscounts = aggregatedDiscountsOverride ?? getAggregatedDiscounts(formState, preparedLineItems)

    const payload: UpdateOrderDto = {
      temporalOrderId: formState.temporalOrderId,
      ...(formState.orderNumber != null && formState.orderNumber >= 1 && { orderNumber: formState.orderNumber }),
      customerInfo: formState.customerInfo,
      financialStatus: formState.financialStatus,
      fulfillmentStatus: formState.fulfillmentStatus,
      currencyId: formState.currencyId,
      subtotalPrice: formState.subtotalPrice,
      totalTax: formState.totalTax,
      totalDiscounts: aggregatedDiscounts,
      totalPrice: formState.totalPrice,
      shippingAddress: formState.shippingAddress,
      billingAddress: formState.billingAddress,
      couponId: formState.couponId ?? null,
      paymentProviderId: formState.paymentProviderId,
      paymentStatus: formState.paymentStatus,
      paymentDetails: formState.paymentDetails,
      shippingMethodId: formState.shippingMethodId,
      shippingStatus: formState.shippingStatus,
      trackingNumber: formState.trackingNumber,
      trackingUrl: formState.trackingUrl,
      estimatedDeliveryDate: formState.estimatedDeliveryDate,
      shippedAt: formState.shippedAt,
      deliveredAt: formState.deliveredAt,
      customerNotes: formState.customerNotes,
      internalNotes: formState.internalNotes,
      preferredDeliveryDate: formState.preferredDeliveryDate,
      lineItems: preparedLineItems,
      // Agregar createdAt solo si se estableció manualmente
      ...(formState.useCustomCreatedAt && formState.createdAt ? { createdAt: formState.createdAt } : {}),
    }

    return sanitizeUpdatePayload(payload)
  }

  const buildUpdateDiffPayload = (
    current: UpdateOrderDto,
    original: UpdateOrderDto | null,
  ): UpdateOrderDto => {
    if (!original) {
      return current
    }

    const diff: Partial<UpdateOrderDto> = {}
    const allKeys = new Set([
      ...Object.keys(current),
      ...Object.keys(original),
    ]) as Set<keyof UpdateOrderDto>

    allKeys.forEach((key) => {
      const hasCurrent = Object.prototype.hasOwnProperty.call(current, key)
      const hasOriginal = Object.prototype.hasOwnProperty.call(original, key)

      if (!hasCurrent) {
        return
      }

      const currentValue = current[key]
      const originalValue = original[key]

      if (!hasOriginal || !isDeepEqual(currentValue, originalValue)) {
        if (currentValue !== undefined) {
          ;(diff as Record<string, unknown>)[key as string] = currentValue
        }
      }
    })

    return diff as UpdateOrderDto
  }

  // Sincronizar la dirección de facturación con la de envío cuando cambia la dirección de envío
  useEffect(() => {
    if (formData.shippingAddress && Object.keys(formData.shippingAddress).length > 0) {
      setFormData((prev) => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress },
      }))
    }
  }, [formData.shippingAddress])

  const latestShopSettingsState = shopSettings
  const latestStoresState = stores
  const latestCouponsState = coupons

  useEffect(() => {
    if (!targetStoreId) {
      if (stores.length === 0 && !ownerId) return
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada ni tiendas disponibles.",
      })
      return
    }

    if (loadedStoreId === targetStoreId && isInitialized) return

    const needsShopSettings = !orderId || true
    const needsCoupons = !!orderId
    if (needsShopSettings && isShopSettingsLoading) return
    if (needsCoupons && isCouponsLoading) return

    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        if (orderId) {
          const orderOrOrdersResult = await queryClient.fetchQuery({
            queryKey: queryKeys.order.byId(targetStoreId!, orderId),
            queryFn: () => fetchOrderById(targetStoreId!, orderId),
          })
          const order = orderOrOrdersResult as Order
          const latestOrdersState: Order[] = [order]
          setLoadedStoreId(targetStoreId!)

          const convertedOrder: CreateOrderDto & Partial<UpdateOrderDto> = {
            temporalOrderId: order.temporalOrderId || undefined,
            orderNumber: order.orderNumber ?? 1000,
              customerInfo: order.customerInfo || {},
              currencyId: order.currencyId,
              totalPrice: order.totalPrice,
              subtotalPrice: order.subtotalPrice,
              totalTax: order.totalTax,
              totalDiscounts: order.totalDiscounts,
              lineItems:
                order.lineItems
                  ?.filter((item) => item.id || item.variantId !== undefined)
                  .map((item) => ({
                    id: item.id,
                    variantId: item.variantId ?? undefined,
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
              shippedAt: order.shippedAt || undefined,
              deliveredAt: order.deliveredAt || undefined,
              customerNotes: order.customerNotes || "",
              internalNotes: order.internalNotes || "",
              source: order.source || "web",
              preferredDeliveryDate: order.preferredDeliveryDate || new Date(),
              // Convert nullable enum values to undefined instead of null
              financialStatus: order.financialStatus || undefined,
              fulfillmentStatus: order.fulfillmentStatus || undefined,
            }
            const shopSettingsForOrder =
              latestShopSettingsState.find((setting) => setting.storeId === (order.storeId || targetStoreId!)) || null

            const { manualDiscount, couponDiscount } = deriveExistingOrderDiscounts(
              {
                lineItems: convertedOrder.lineItems,
                totalDiscounts: order.totalDiscounts,
                couponId: convertedOrder.couponId,
              },
              latestCouponsState ?? [],
              shopSettingsForOrder,
            )

            setFormData((prev) => {
              const nextFormData: OrderFormState = {
                ...prev,
                ...convertedOrder,
                lineItems: convertedOrder.lineItems ?? [],
                manualDiscountTotal: manualDiscount,
                couponDiscountTotal: couponDiscount,
              }
              const preparedSnapshotLineItems = prepareLineItemsForPayload(nextFormData.lineItems)
              const snapshotAggregatedDiscounts = getAggregatedDiscounts(nextFormData, preparedSnapshotLineItems)
              const snapshotPayload = buildUpdatePayload(
                nextFormData,
                preparedSnapshotLineItems,
                snapshotAggregatedDiscounts,
              )
              setInitialOrderSnapshot(snapshotPayload)
              return nextFormData
            })
        } else {
          // Para nuevas órdenes: obtener siguiente número del API y configurar datos predeterminados
          const targetStore = targetStoreId!
          if (targetStore) {
            const nextNumberResult = await queryClient.fetchQuery({
              queryKey: queryKeys.orders.nextOrderNumber(targetStore),
              queryFn: () => fetchNextOrderNumber(targetStore),
            })
            const settings = latestShopSettingsState.find((s) => s.storeId === targetStore)
            const storeData = latestStoresState.find((s) => s.id === targetStore)
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
              orderNumber: nextNumberResult.nextOrderNumber,
              currencyId: settings?.defaultCurrencyId || "",
              shippingAddress: initialShippingAddress,
              billingAddress: initialShippingAddress,
              couponId: undefined,
              paymentProviderId: undefined,
              shippingMethodId: undefined,
            }
            setFormData((prev) => ({
              ...prev,
              ...initialData,
            }))
            setLoadedStoreId(targetStore)
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos necesarios. Por favor, inténtelo de nuevo.",
        })
        console.error("[OrderForm] Failed to load initial data", error)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    loadInitialData()
  }, [
    targetStoreId,
    isInitialized,
    loadedStoreId,
    latestShopSettingsState,
    latestStoresState,
    latestCouponsState,
    toast,
    ownerId,
    orderId,
    queryClient,
  ])

  // Función para generar el JSON de depuración
  const generateDebugPayload = () => {
    const preparedLineItems = prepareLineItemsForPayload(formData.lineItems)
    const aggregatedDiscounts = getAggregatedDiscounts(formData, preparedLineItems)

    if (orderId) {
      const fullUpdatePayload = buildUpdatePayload(formData, preparedLineItems, aggregatedDiscounts)
      const diffPayload = buildUpdateDiffPayload(fullUpdatePayload, initialOrderSnapshot)
      const payloadToShow = Object.keys(diffPayload).length > 0 ? diffPayload : fullUpdatePayload
      return JSON.stringify(payloadToShow, null, 2)
    }

    const createData: CreateOrderDto = {
      temporalOrderId: formData.temporalOrderId,
      orderNumber: formData.orderNumber,
      customerInfo: formData.customerInfo || {},
      financialStatus: formData.financialStatus,
      fulfillmentStatus: formData.fulfillmentStatus,
      currencyId: formData.currencyId,
      totalPrice: formData.totalPrice,
      subtotalPrice: formData.subtotalPrice,
      totalTax: formData.totalTax,
      totalDiscounts: aggregatedDiscounts,
      lineItems: preparedLineItems,
      shippingAddress: formData.shippingAddress || {},
      billingAddress: formData.billingAddress || formData.shippingAddress || {},
      couponId: formData.couponId,
      paymentProviderId: formData.paymentProviderId,
      paymentStatus: formData.paymentStatus,
      paymentDetails: formData.paymentDetails,
      shippingMethodId: formData.shippingMethodId,
      shippingStatus: formData.shippingStatus,
      trackingNumber: formData.trackingNumber,
      trackingUrl: formData.trackingUrl,
      estimatedDeliveryDate: formData.estimatedDeliveryDate,
      shippedAt: formData.shippedAt,
      deliveredAt: formData.deliveredAt,
      customerNotes: formData.customerNotes,
      internalNotes: formData.internalNotes,
      source: formData.source,
      preferredDeliveryDate: formData.preferredDeliveryDate,
      // Agregar createdAt solo si se estableció manualmente
      ...(formData.useCustomCreatedAt && formData.createdAt ? { createdAt: formData.createdAt } : {}),
    }
    return JSON.stringify(createData, null, 2)
  }

  // Actualizar el payload de depuración cuando cambie el formData
  useEffect(() => {
    if (isInitialized) {
      setDebugPayload(generateDebugPayload())
    }
  }, [formData, isInitialized, currentStore, orderId, initialOrderSnapshot])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormSubmitAttempted(true)
    setSubmissionError(null)

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

    try {
      const preparedLineItems = prepareLineItemsForPayload(formData.lineItems)
      const aggregatedDiscounts = getAggregatedDiscounts(formData, preparedLineItems)

      if (orderId) {
        const fullUpdatePayload = buildUpdatePayload(formData, preparedLineItems, aggregatedDiscounts)
        const diffPayload = buildUpdateDiffPayload(fullUpdatePayload, initialOrderSnapshot)
        const payloadToSend = Object.keys(diffPayload).length > 0 ? diffPayload : fullUpdatePayload
        await updateOrderMutation.mutateAsync({ orderId, data: payloadToSend })
      } else {
        const createData: CreateOrderDto = {
          temporalOrderId: formData.temporalOrderId,
          orderNumber: formData.orderNumber,
          customerInfo: formData.customerInfo || {},
          financialStatus: formData.financialStatus,
          fulfillmentStatus: formData.fulfillmentStatus,
          currencyId: formData.currencyId,
          totalPrice: formData.totalPrice,
          subtotalPrice: formData.subtotalPrice,
          totalTax: formData.totalTax,
          totalDiscounts: aggregatedDiscounts,
          shippingAddress: formData.shippingAddress || {},
          billingAddress: formData.billingAddress || formData.shippingAddress || {},
          couponId: formData.couponId,
          paymentProviderId: formData.paymentProviderId,
          paymentStatus: formData.paymentStatus,
          paymentDetails: formData.paymentDetails,
          shippingMethodId: formData.shippingMethodId,
          shippingStatus: formData.shippingStatus,
          trackingNumber: formData.trackingNumber,
          trackingUrl: formData.trackingUrl,
          estimatedDeliveryDate: formData.estimatedDeliveryDate,
          shippedAt: formData.shippedAt,
          deliveredAt: formData.deliveredAt,
          customerNotes: formData.customerNotes,
          internalNotes: formData.internalNotes,
          preferredDeliveryDate: formData.preferredDeliveryDate,
          lineItems: preparedLineItems,
          // Agregar createdAt solo si se estableció manualmente
          ...(formData.useCustomCreatedAt && formData.createdAt ? { createdAt: formData.createdAt } : {}),
        }
        await createOrderMutation.mutateAsync(createData)
      }
      toast({
        title: "Éxito",
        description: `Pedido ${orderId ? "actualizado" : "creado"} correctamente`,
      })
      router.push("/orders")
    } catch (error) {
      const mappedError = mapOrderError(error)
      setSubmissionError(mappedError)
      toast({
        variant: "destructive",
        title: mappedError.summary,
        description: mappedError.explanation ?? mappedError.technicalMessages[0],
      })
      console.error("[OrderForm] Failed to submit order", error)
    } finally {
      setIsLoading(false)
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
  const missingRequiredData = !formData.currencyId || formData.lineItems.length === 0

  // Función para verificar si una sección está completa
  const isSectionComplete = (section: string): boolean => {
    switch (section) {
      case "products":
        return formData.lineItems.length > 0 && !!formData.currencyId
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
  const currentStoreData = stores.find((s) => s.id === currentStore)
  const currentShopSettings = shopSettings.find((s) => s.storeId === currentStore)

  const productsHasError = hasSectionError("products")
  const customerHasError = hasSectionError("customer")
  const shippingHasError = hasSectionError("shipping")
  const paymentHasError = hasSectionError("payment")

  const stepItems: StepItem[] = [
    {
      id: "products",
      label: "1. Productos",
      baseDescription: `${formData.lineItems.length} productos seleccionados`,
      hasError: productsHasError,
      isComplete: isSectionComplete("products"),
      baseIcon: ShoppingCart,
    },
    {
      id: "customer",
      label: "2. Cliente",
      baseDescription: formData.customerInfo?.name || "Sin cliente",
      hasError: customerHasError,
      isComplete: isSectionComplete("customer"),
      baseIcon: User,
    },
    {
      id: "shipping",
      label: "3. Envío",
      baseDescription: formData.shippingAddress?.address1 ? "Dirección completa" : "Sin dirección",
      hasError: shippingHasError,
      isComplete: isSectionComplete("shipping"),
      baseIcon: Truck,
    },
    {
      id: "payment",
      label: "4. Pago",
      baseDescription: formData.paymentProviderId ? "Método seleccionado" : "Sin método de pago",
      hasError: paymentHasError,
      isComplete: isSectionComplete("payment"),
      baseIcon: CreditCard,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/orders")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{orderId ? "Editar Pedido" : "Nuevo Pedido"}</h1>
              {orderId && <Badge variant="outline">ID: {orderId.substring(0, 8)}</Badge>}
              {currentStoreData && (
                <Badge variant="secondary" className="ml-1">
                  Tienda: {currentStoreData.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30"
            >
              Cancelar
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDevPanelOpen(true)}
              className="text-muted-foreground hover:text-primary"
              title="Ver JSON para desarrolladores"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary/90 text-primary-foreground shadow-sm transition hover:bg-primary"
              disabled={isLoading || missingRequiredData}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Guardando..." : orderId ? "Actualizar Pedido" : "Crear Pedido"}
            </Button>
          </div>
        </div>
      </header>

      {/* Solo mostrar la alerta cuando se intente enviar el formulario y falten datos */}
      {missingRequiredData && formSubmitAttempted && (
        <Alert className="mx-6 mt-4 border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Para crear un pedido, debe seleccionar al menos un producto y una moneda.
          </AlertDescription>
        </Alert>
      )}

      {submissionError && (
        <Alert variant="outline" className="mx-6 mt-4 border-border/60 bg-card/70 text-foreground">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-sm font-semibold">Revisa las secciones marcadas</AlertTitle>
            <p className="text-xs text-muted-foreground">Corrige los datos resaltados y vuelve a intentar.</p>
            <details className="group mt-1 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">
                Ver resumen técnico ({detailMessages.length})
              </summary>
              <div className="mt-2 space-y-2">
                <p className="font-medium text-sm text-foreground">{submissionError.summary}</p>
                {submissionError.explanation && (
                  <p className="text-sm text-muted-foreground">{submissionError.explanation}</p>
                )}
                {submissionError.httpStatus && (
                  <p className="text-xs text-muted-foreground">Código recibido: {submissionError.httpStatus}</p>
                )}
                {detailMessages.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    {detailMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>
        </Alert>
      )}

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Navegación de pasos */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max items-stretch overflow-hidden rounded-lg border border-border/40 bg-background/70 shadow-sm">
            {stepItems.map(({ id, label, baseDescription, hasError, isComplete, baseIcon }) => {
              const isActive = activeSection === id
              const IconComponent = hasError ? AlertCircle : isComplete ? CheckCircle2 : baseIcon
              const description = hasError ? "Revisa esta sección" : baseDescription

              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={getStepButtonClass(hasError, isActive)}
                >
                  <div className={getStepIconClass(hasError, isComplete)}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{label}</div>
                    <div className={getDescriptionClass(hasError)}>{description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {isInitialized ? (
              <>
                {activeSection === "products" && (
                  <section className={getSectionCardClass(productsHasError)}>
                    <OrderDetails
                      formData={formData}
                      setFormData={setFormData}
                      products={[]}
                      currencies={currencies}
                      coupons={coupons}
                      shippingMethods={shippingMethods}
                      shopSettings={shopSettings}
                      setIsProductDialogOpen={setIsProductDialogOpen}
                      setIsPOSDialogOpen={setIsPOSDialogOpen}
                      sectionErrors={getSectionErrors("products")}
                      isEditMode={!!orderId}
                    />
                  </section>
                )}

                {activeSection === "customer" && (
                  <section className={getSectionCardClass(customerHasError)}>
                    <CustomerInfo
                      formData={formData}
                      setFormData={setFormData}
                      sectionErrors={getSectionErrors("customer")}
                    />
                  </section>
                )}

                {activeSection === "shipping" && (
                  <section className={getSectionCardClass(shippingHasError)}>
                    <ShippingAndBilling
                      formData={formData}
                      setFormData={setFormData}
                      sectionErrors={getSectionErrors("shipping")}
                    />
                  </section>
                )}

                {activeSection === "payment" && (
                  <div className="space-y-6">
                    <section className={getSectionCardClass(paymentHasError)}>
                      <PaymentAndDiscounts
                        formData={formData}
                        setFormData={setFormData}
                        paymentProviders={paymentProviders}
                        sectionErrors={getSectionErrors("payment")}
                      />
                    </section>
                    <section className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
                      <OrderStatus formData={formData} setFormData={setFormData} />
                    </section>
                    <section className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
                      <AdditionalInfo formData={formData} setFormData={setFormData} />
                    </section>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border border-border/30 bg-card/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Cargando datos...</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral con resumen */}
          <div className="space-y-6">
            <aside className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
              <h2 className="mb-4 flex items-center text-base font-semibold tracking-tight text-muted-foreground">
                <Package className="mr-2 h-4 w-4 text-primary" />
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Número de Orden</span>
                  <span className="text-sm font-medium">{formData.orderNumber}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Productos</span>
                  <span className="text-sm font-medium">{formData.lineItems.length}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.subtotalPrice || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Total descuentos</span>
                  <span className="text-sm font-medium text-destructive">
                    -{formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {totalDiscountSummary.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Impuestos</span>
                  <span className="text-sm font-medium">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.totalTax || 0).toFixed(2)}
                    {currentShopSettings?.taxValue !== null && currentShopSettings?.taxValue !== undefined && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (
                        {Number(currentShopSettings.taxValue) > 1
                          ? `${currentShopSettings.taxValue}%`
                          : `${currentShopSettings.taxValue * 100}%`}
                        )
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-md bg-primary/5 px-3 py-3 text-sm">
                  <span className="font-semibold text-primary">Total</span>
                  <span className="font-semibold text-primary">
                    {formData.currencyId && currencies.find((c) => c.id === formData.currencyId)?.symbol}
                    {Number(formData.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-border/30 pt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Información del Cliente</h3>
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

              <div className="mt-5 border-t border-border/30 pt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Dirección de Envío</h3>
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
                <div className="mt-5 border-t border-border/30 pt-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Información de la Tienda</h3>
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
                  className="w-full bg-primary/90 text-primary-foreground shadow-sm transition hover:bg-primary"
                  disabled={isLoading || missingRequiredData}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : orderId ? "Actualizar Pedido" : "Crear Pedido"}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <ProductSelectionDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        selectedCurrency={formData.currencyId}
        onConfirm={(selections) => {
          // Convertir selecciones a CreateOrderItemDto
          const newLineItems: CreateOrderItemDto[] = selections.map((selection) => {
            const product = selection.product
            const variant = selection.variantId
              ? product.variants.find((v) => v.id === selection.variantId)!
              : product.variants[0]

            const priceString = variant.prices.find((p) => p.currencyId === formData.currencyId)?.price || "0"
            const price = typeof priceString === "string" ? Number.parseFloat(priceString) : priceString

            return {
              variantId: variant.id,
              title: generateStandardizedProductTitleFromObjects(product, variant),
              price: price,
              quantity: 1,
              totalDiscount: 0,
            }
          })

          // Consolidar productos duplicados por variantId
          setFormData((prev) => ({
            ...prev,
            lineItems: consolidateLineItems(prev.lineItems, newLineItems),
          }))
        }}
        currentLineItems={[]} // Simplificado - el diálogo maneja su propio estado
      />

      <POSScannerDialog
        open={isPOSDialogOpen}
        onOpenChange={setIsPOSDialogOpen}
        selectedCurrency={formData.currencyId}
        onProductScanned={(product, variant, quantity) => {
          const priceString = variant.prices.find((p) => p.currencyId === formData.currencyId)?.price || "0"
          const price = typeof priceString === "string" ? Number.parseFloat(priceString) : priceString

          const newLineItem: CreateOrderItemDto = {
            variantId: variant.id,
            title: generateStandardizedProductTitleFromObjects(product, variant),
            price: price,
            quantity: quantity,
            totalDiscount: 0,
          }

          setFormData((prev) => ({
            ...prev,
            lineItems: consolidateLineItems(prev.lineItems, [newLineItem]),
          }))
        }}
      />

      {/* Panel de Desarrollador - JSON del formulario */}
      <Dialog open={isDevPanelOpen} onOpenChange={setIsDevPanelOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              JSON del Formulario
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copiar JSON
              </Button>
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
          <div className="flex flex-col flex-1 min-h-0 mt-4">
            <div className="flex-1 overflow-auto">
              <div className="bg-card text-card-foreground dark:bg-muted dark:text-muted-foreground p-4 rounded-md overflow-auto border">
                <pre className="text-sm font-mono whitespace-pre-wrap">{debugPayload}</pre>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Este JSON es el que se enviará al servidor al {orderId ? "actualizar" : "crear"} la orden.</p>
              <p>Puedes usarlo para pruebas en Postman o para depuración.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
