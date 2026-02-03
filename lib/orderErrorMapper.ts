import { AxiosError, isAxiosError } from "axios"

export type OrderFormSectionKey = "general" | "products" | "customer" | "shipping" | "payment"

export interface OrderErrorFeedback {
  summary: string
  explanation?: string
  httpStatus?: number
  technicalMessages: string[]
  sectionHints: Partial<Record<OrderFormSectionKey, string[]>>
  rawError?: unknown
}

type MaybeRecord = Record<string, unknown>

const SECTION_KEYWORD_MAP: Array<{
  section: OrderFormSectionKey
  keywords: RegExp[]
  friendlyHint: (message: string) => string
}> = [
  {
    section: "products",
    keywords: [
      /line\s?items?/i,
      /variant/i,
      /inventory/i,
      /stock/i,
      /producto/i,
      /art[ií]culo/i,
      /descuento/i,
    ],
    friendlyHint: (message) => `Revisa los productos seleccionados. Detalle técnico: ${message}`,
  },
  {
    section: "customer",
    keywords: [/(customer|cliente)/i, /email/i, /phone/i, /nombre/i],
    friendlyHint: (message) => `Completa o corrige los datos del cliente. Detalle técnico: ${message}`,
  },
  {
    section: "shipping",
    keywords: [/shipping/i, /env[ií]o/i, /direcci[oó]n/i, /address/i, /postal/i],
    friendlyHint: (message) => `Actualiza la dirección o método de envío. Detalle técnico: ${message}`,
  },
  {
    section: "payment",
    keywords: [/payment/i, /pago/i, /financial status/i, /coupon/i, /cupon/i, /metodo de pago/i],
    friendlyHint: (message) => `Verifica los datos de pago o cupones. Detalle técnico: ${message}`,
  },
]

const DEFAULT_FEEDBACK: OrderErrorFeedback = {
  summary: "No pudimos guardar el pedido",
  explanation: "Revisa los datos ingresados e inténtalo nuevamente.",
  technicalMessages: [],
  sectionHints: {},
}

export function mapOrderError(error: unknown): OrderErrorFeedback {
  const baseFeedback: OrderErrorFeedback = { ...DEFAULT_FEEDBACK, sectionHints: {} }

  if (!isAxiosError(error)) {
    return {
      ...baseFeedback,
      technicalMessages: [stringifyUnknown(error)],
      rawError: error,
    }
  }

  const axiosError = error as AxiosError
  const responseData = axiosError.response?.data as MaybeRecord | undefined
  const statusCode =
    axiosError.response?.status ?? (typeof responseData?.statusCode === "number" ? responseData?.statusCode : undefined)

  const collectedMessages = collectAllMessages(
    responseData,
    axiosError.message,
    axiosError.response?.statusText,
    axiosError.code,
  )

  const sectionHints = deriveSectionHints(collectedMessages)
  const summary = buildSummary(statusCode, collectedMessages)
  const explanation = buildExplanation(statusCode, collectedMessages)

  return {
    summary,
    explanation,
    httpStatus: statusCode,
    technicalMessages: collectedMessages.length ? collectedMessages : [stringifyUnknown(responseData) ?? axiosError.message],
    sectionHints,
    rawError: responseData ?? error,
  }
}

function collectAllMessages(
  responseData: MaybeRecord | undefined,
  ...fallbacks: Array<string | undefined>
): string[] {
  const messages = new Set<string>()

  const pushMessage = (message?: string | null) => {
    if (typeof message === "string") {
      const trimmed = message.trim()
      if (trimmed.length > 0) {
        messages.add(trimmed)
      }
    }
  }

  if (responseData) {
    pushMessage(typeof responseData.message === "string" ? responseData.message : undefined)
    extractFromUnknown(responseData.message, pushMessage)
    extractFromUnknown((responseData as MaybeRecord)?.error, pushMessage)
    extractFromUnknown((responseData as MaybeRecord)?.details, pushMessage)
    extractFromUnknown((responseData as MaybeRecord)?.errors, pushMessage)
    extractFromUnknown((responseData as MaybeRecord)?.issues, pushMessage)
  }

  fallbacks.forEach(pushMessage)

  return Array.from(messages)
}

function extractFromUnknown(entry: unknown, push: (message?: string | null) => void, visited = new Set<unknown>()) {
  if (entry === null || entry === undefined) {
    return
  }

  if (visited.has(entry)) {
    return
  }

  if (typeof entry === "string") {
    push(entry)
    return
  }

  if (Array.isArray(entry)) {
    visited.add(entry)
    entry.forEach((item) => extractFromUnknown(item, push, visited))
    return
  }

  if (typeof entry === "object") {
    visited.add(entry)
    const record = entry as MaybeRecord

    if (typeof record.message === "string") {
      push(record.message)
    } else if (Array.isArray(record.message)) {
      extractFromUnknown(record.message, push, visited)
    }

    if (typeof record.description === "string") {
      push(record.description)
    }

    if (typeof record.detail === "string") {
      push(record.detail)
    }

    if (typeof record.field === "string" && typeof record.error === "string") {
      push(`${record.field}: ${record.error}`)
    }

    if (typeof record.property === "string") {
      if (typeof record.value !== "undefined" && typeof record.errorMessage === "string") {
        push(`${record.property}: ${record.errorMessage}`)
      }

      if (record.constraints && typeof record.constraints === "object") {
        Object.values(record.constraints).forEach((constraint) => {
          if (typeof constraint === "string") {
            push(constraint)
          }
        })
      }
    }

    Object.entries(record).forEach(([key, value]) => {
      if (key !== "message" && key !== "constraints") {
        extractFromUnknown(value, push, visited)
      }
    })
  }
}

function buildSummary(statusCode: number | undefined, messages: string[]): string {
  if (!statusCode) {
    return "No pudimos guardar el pedido"
  }

  if (statusCode === 409) {
    const duplicateNumber = messages.find((msg) => /order number/i.test(msg) || /número de orden/i.test(msg))
    if (duplicateNumber) {
      return "El número de pedido ya existe en esta tienda"
    }
    return "Hay un conflicto con los datos del pedido"
  }

  if (statusCode === 404) {
    return "No encontramos uno de los recursos necesarios"
  }

  if (statusCode === 400) {
    return "Necesitamos que revises los datos del pedido"
  }

  if (statusCode >= 500) {
    return "Ocurrió un problema en el servidor"
  }

  return "No pudimos guardar el pedido"
}

function buildExplanation(statusCode: number | undefined, messages: string[]): string | undefined {
  if (!statusCode) {
    return undefined
  }

  switch (statusCode) {
    case 400: {
      const inventoryIssue = messages.find((msg) => /insufficient inventory|inventario/i.test(msg))
      if (inventoryIssue) {
        return "Confirma la disponibilidad de inventario o ajusta las cantidades."
      }
      const validationIssue = messages.find((msg) => /must|debe|requerid/i.test(msg))
      if (validationIssue) {
        return "Hay campos obligatorios con datos faltantes o inválidos."
      }
      return "Algunos datos no cumplen con las validaciones requeridas."
    }
    case 404:
      return "Verifica que la tienda y los recursos asociados (monedas, cupones, variantes) sigan disponibles."
    case 409:
      return "Genera un nuevo número de pedido o consulta los pedidos existentes antes de continuar."
    default:
      return "Intenta nuevamente en unos instantes. Si el problema persiste, contacta al equipo técnico."
  }
}

function deriveSectionHints(messages: string[]): Partial<Record<OrderFormSectionKey, string[]>> {
  const hints: Partial<Record<OrderFormSectionKey, string[]>> = {}

  const pushHint = (section: OrderFormSectionKey, hint: string) => {
    if (!hints[section]) {
      hints[section] = []
    }
    if (!hints[section]!.includes(hint)) {
      hints[section]!.push(hint)
    }
  }

  messages.forEach((message) => {
    let matchedSection = false
    SECTION_KEYWORD_MAP.forEach(({ section, keywords, friendlyHint }) => {
      if (keywords.some((regex) => regex.test(message))) {
        pushHint(section, friendlyHint(message))
        matchedSection = true
      }
    })

    if (!matchedSection) {
      pushHint(
        "general",
        `Revisa el resumen del pedido y vuelve a intentar. Detalle técnico: ${message}`,
      )
    }
  })

  return hints
}

function stringifyUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message
  }
  if (typeof value === "string") {
    return value
  }
  try {
    const json = JSON.stringify(value, null, 2)
    if (json) {
      return json
    }
  } catch {
  }
  return String(value)
}

