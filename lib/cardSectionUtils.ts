import type { CreateCardSectionDto, CardDto, CreateCardSectionPayload, CardPayload } from "@/types/card"

/**
 * Limpia valores opcionales convirtiendo strings vacíos a undefined
 */
const cleanOptionalValue = (value: string | null | undefined): string | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  return value
}

/**
 * Elimina propiedades undefined de un objeto recursivamente
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map(removeUndefined)
  const cleaned: any = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = removeUndefined(obj[key])
    }
  }
  return cleaned
}

/**
 * Prepara los datos de una card section para enviar al backend
 * Aplica todas las transformaciones necesarias (limpieza, mapeo, etc.)
 */
export function prepareCardSectionData(data: any): CreateCardSectionPayload | null {
  if (!data) return null

  const sectionData = data as Partial<CreateCardSectionDto>
  const cardsData = Array.isArray(sectionData.cards) ? sectionData.cards : []

  const prepared: CreateCardSectionPayload = {
    title: sectionData.title || "",
    cards: cardsData
      .filter((card) => Boolean(card && card.title))
      .map((card) => {
        const sanitized: CardPayload = {
          title: card.title || "",
        }

        const subtitle = cleanOptionalValue(card.subtitle ?? undefined)
        if (subtitle) sanitized.subtitle = subtitle

        const description = cleanOptionalValue(card.description ?? undefined)
        if (description) sanitized.description = description

        const imageUrl = cleanOptionalValue(card.imageUrl ?? undefined)
        if (imageUrl) sanitized.imageUrl = imageUrl

        const linkUrl = cleanOptionalValue(card.linkUrl ?? undefined)
        if (linkUrl) sanitized.linkUrl = linkUrl

        const linkText = cleanOptionalValue((card as CardDto)?.linkText ?? undefined)
        if (linkText) sanitized.linkText = linkText

        const videoUrl = cleanOptionalValue((card as CardDto)?.videoUrl ?? undefined)
        if (videoUrl) sanitized.videoUrl = videoUrl

        return sanitized
      }),
  }

  const subtitle = cleanOptionalValue(sectionData.subtitle)
  if (subtitle) prepared.subtitle = subtitle

  const description = cleanOptionalValue(sectionData.description)
  if (description) prepared.description = description

  if (typeof sectionData.isActive === "boolean") {
    prepared.isActive = sectionData.isActive
  }

  return removeUndefined(prepared) as CreateCardSectionPayload
}

