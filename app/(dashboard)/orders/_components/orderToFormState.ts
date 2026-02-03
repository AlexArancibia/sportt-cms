import type { Order } from "@/types/order"
import { ShippingStatus } from "@/types/common"
import { DiscountType } from "@/types/common"
import type { OrderFormState } from "./orderFormTypes"
import type { Coupon } from "@/types/coupon"
import type { ShopSettings } from "@/types/store"

const roundCurrency = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100

const toNumberSafe = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function getTaxRateFromSettings(settings: { taxValue?: number | null } | null): number {
  const rawValue = toNumberSafe(settings?.taxValue ?? 0)
  return rawValue > 1 ? rawValue / 100 : rawValue
}

function calculateCouponDiscount(
  couponId: string | undefined,
  couponList: Array<{ id: string; type: DiscountType; value?: number | null }>,
  subtotalBeforeDiscount: number,
  subtotalAfterLineItemDiscount: number
): number {
  if (!couponId) return 0
  const coupon = couponList.find((c) => c.id === couponId)
  if (!coupon) return 0
  const discountBase = subtotalBeforeDiscount
  const discountCapacity = Math.max(0, subtotalAfterLineItemDiscount)
  let discountAmount = 0
  switch (coupon.type) {
    case DiscountType.PERCENTAGE:
      discountAmount = (toNumberSafe(coupon.value) / 100) * discountBase
      break
    case DiscountType.FIXED_AMOUNT:
      discountAmount = toNumberSafe(coupon.value)
      break
    default:
      discountAmount = 0
  }
  return roundCurrency(Math.min(Math.max(0, discountAmount), discountCapacity))
}

function calculateManualDiscount(
  orderTotalDiscounts: unknown,
  lineItemDiscountTotal: number,
  couponDiscount: number
): number {
  return roundCurrency(
    Math.max(0, toNumberSafe(orderTotalDiscounts) - lineItemDiscountTotal - couponDiscount)
  )
}

function deriveExistingOrderDiscounts(
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
  shopSettingsForOrder: { taxesIncluded?: boolean | null; taxValue?: number | null } | null
): { manualDiscount: number; couponDiscount: number } {
  const taxesIncluded = shopSettingsForOrder?.taxesIncluded ?? false
  const taxRateValue = getTaxRateFromSettings(shopSettingsForOrder)
  const lineItemDiscountTotal = orderData.lineItems.reduce(
    (sum, item) => sum + toNumberSafe(item.totalDiscount ?? 0),
    0
  )
  const grossTotal = orderData.lineItems.reduce((sum, item) => {
    const q = Math.max(0, toNumberSafe(item.quantity ?? 0))
    return sum + toNumberSafe(item.price) * q
  }, 0)
  const subtotalBeforeDiscount =
    taxesIncluded && taxRateValue > 0 ? grossTotal / (1 + taxRateValue) : grossTotal
  const subtotalAfterLineItemDiscount = Math.max(0, subtotalBeforeDiscount - lineItemDiscountTotal)
  const couponDiscount = calculateCouponDiscount(
    orderData.couponId,
    couponList,
    subtotalBeforeDiscount,
    subtotalAfterLineItemDiscount
  )
  const manualDiscount = calculateManualDiscount(
    orderData.totalDiscounts,
    lineItemDiscountTotal,
    couponDiscount
  )
  return { manualDiscount, couponDiscount }
}

export interface OrderToFormStateOptions {
  coupons?: Coupon[]
  shopSettingsForOrder?: ShopSettings | null
}

/** API may return nested { shipping: {...}, billing: {...} } or flat address. */
type RawAddress = Record<string, unknown> | { shipping?: Record<string, unknown>; billing?: Record<string, unknown> }

function normalizeAddress(addr: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!addr || typeof addr !== "object") return {}
  return {
    ...addr,
    postalCode: addr.postalCode ?? addr.zip ?? "",
    state: addr.state ?? addr.province ?? "",
    address2: addr.address2 ?? "",
  }
}

export function extractShippingAndBilling(order: Order): {
  shippingAddress: Record<string, unknown>
  billingAddress: Record<string, unknown>
} {
  const rawShipping = (order.shippingAddress || {}) as RawAddress
  const rawBilling = (order.billingAddress || order.shippingAddress || {}) as RawAddress

  // API returns nested: { shipping: {...}, billing: {...} }
  const shipping =
    rawShipping && "shipping" in rawShipping && rawShipping.shipping
      ? rawShipping.shipping
      : rawShipping
  const billing =
    rawBilling && "billing" in rawBilling && rawBilling.billing
      ? rawBilling.billing
      : rawBilling

  return {
    shippingAddress: normalizeAddress(shipping as Record<string, unknown>),
    billingAddress: normalizeAddress(billing as Record<string, unknown>),
  }
}

/**
 * Converts an API Order into OrderFormState for use in View/Edit components.
 */
export function orderToFormState(
  order: Order,
  options: OrderToFormStateOptions = {}
): OrderFormState {
  const coupons = options.coupons ?? []
  const shopSettingsForOrder = options.shopSettingsForOrder ?? null

  const { shippingAddress, billingAddress } = extractShippingAndBilling(order)

  const convertedOrder = {
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
    shippingAddress,
    billingAddress,
    couponId: order.couponId || undefined,
    paymentProviderId: order.paymentProviderId || undefined,
    paymentStatus: order.paymentStatus || undefined,
    paymentDetails: order.paymentDetails || undefined,
    shippingMethodId: order.shippingMethodId || undefined,
    shippingStatus: order.shippingStatus ?? ShippingStatus.PENDING,
    trackingNumber: order.trackingNumber || undefined,
    trackingUrl: order.trackingUrl || undefined,
    estimatedDeliveryDate: order.estimatedDeliveryDate || undefined,
    shippedAt: order.shippedAt || undefined,
    deliveredAt: order.deliveredAt || undefined,
    customerNotes: order.customerNotes || "",
    internalNotes: order.internalNotes || "",
    source: order.source || "web",
    preferredDeliveryDate: order.preferredDeliveryDate
      ? new Date(order.preferredDeliveryDate)
      : new Date(),
    financialStatus: order.financialStatus || undefined,
    fulfillmentStatus: order.fulfillmentStatus || undefined,
  }

  const couponList = coupons.map((c) => ({
    id: c.id,
    type: c.type,
    value: c.value,
  }))

  const shopForDiscount = shopSettingsForOrder
    ? {
        taxesIncluded: shopSettingsForOrder.taxesIncluded,
        taxValue: shopSettingsForOrder.taxValue,
      }
    : null

  const { manualDiscount, couponDiscount } = deriveExistingOrderDiscounts(
    {
      lineItems: convertedOrder.lineItems,
      totalDiscounts: order.totalDiscounts,
      couponId: convertedOrder.couponId,
    },
    couponList,
    shopForDiscount
  )

  return {
    ...convertedOrder,
    lineItems: convertedOrder.lineItems,
    manualDiscountTotal: manualDiscount,
    couponDiscountTotal: couponDiscount,
  }
}
