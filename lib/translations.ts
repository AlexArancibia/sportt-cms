import type {
  OrderFinancialStatus,
  OrderFulfillmentStatus,
  ProductStatus,
  DiscountType,
  FulfillmentStatus,
  PaymentProviderType,
  ShippingMethodType,
  ShippingStatus,
} from "@/types/common"

type TranslatableEnum =
  | OrderFinancialStatus
  | OrderFulfillmentStatus
  | ProductStatus
  | DiscountType
  | FulfillmentStatus
  | PaymentProviderType
  | ShippingMethodType
  | ShippingStatus

const translations: Record<string, Record<string, string>> = {
  OrderFinancialStatus: {
    PENDING: "Pendiente",
    AUTHORIZED: "Autorizado",
    PARTIALLY_PAID: "Parcialmente Pagado",
    PAID: "Pagado",
    PARTIALLY_REFUNDED: "Parcialmente Reembolsado",
    REFUNDED: "Reembolsado",
    VOIDED: "Anulado",
  },
  OrderFulfillmentStatus: {
    UNFULFILLED: "No Cumplido",
    PARTIALLY_FULFILLED: "Parcialmente Cumplido",
    FULFILLED: "Cumplido",
    RESTOCKED: "Reabastecido",
    PENDING_FULFILLMENT: "Cumplimiento Pendiente",
    OPEN: "Abierto",
    IN_PROGRESS: "En Progreso",
    ON_HOLD: "En Espera",
    SCHEDULED: "Programado",
  },
  ProductStatus: {
    DRAFT: "Borrador",
    ACTIVE: "Activo",
    ARCHIVED: "Archivado",
  },
  DiscountType: {
    PERCENTAGE: "Porcentaje",
    FIXED_AMOUNT: "Monto Fijo",
    BUY_X_GET_Y: "Compre X Lleve Y",
    FREE_SHIPPING: "Envío Gratis",
  },
  FulfillmentStatus: {
    PENDING: "Pendiente",
    OPEN: "Abierto",
    SUCCESS: "Exitoso",
    CANCELLED: "Cancelado",
    ERROR: "Error",
    FAILURE: "Fallido",
  },
  PaymentProviderType: {
    CREDIT_CARD: "Tarjeta de Crédito",
    PAYPAL: "PayPal",
    STRIPE: "Stripe",
    BANK_TRANSFER: "Transferencia Bancaria",
    CASH_ON_DELIVERY: "Pago Contra Entrega",
    OTHER: "Otro",
  },
  ShippingMethodType: {
    STANDARD: "Estándar",
    EXPRESS: "Expreso",
    OVERNIGHT: "Entrega al Día Siguiente",
    FREE: "Gratis",
    PICKUP: "Recogida en Tienda",
    CUSTOM: "Personalizado",
  },
  ShippingStatus: {
    PENDING: "Pendiente",
    READY_FOR_SHIPPING: "Listo para Enviar",
    IN_TRANSIT: "En Tránsito",
    DELIVERED: "Entregado",
    RETURNED: "Devuelto",
  },
}

export function translateEnum(enumValue: TranslatableEnum | null | undefined): string {
  if (enumValue === null || enumValue === undefined) {
    return ""
  }
  const enumType = Object.keys(translations).find((key) => Object.keys(translations[key]).includes(enumValue as string))

  if (!enumType) {
    return enumValue as string
  }

  return translations[enumType][enumValue as string] || (enumValue as string)
}

