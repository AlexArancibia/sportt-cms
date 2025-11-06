import type { CreateCardSectionDto, CardDto } from "@/types/card"

/**
 * Limpia valores opcionales convirtiendo strings vacíos a undefined
 */
const cleanOptionalValue = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === "string" && value.trim() === "") return undefined
  return value
}

/**
 * Limpia metadata eliminando campos vacíos
 */
const cleanMetadata = (metadata: any) => {
  if (!metadata) return undefined
  const cleaned: any = {}
  if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
    cleaned.tags = metadata.tags
  }
  if (metadata.seoTitle && typeof metadata.seoTitle === "string" && metadata.seoTitle.trim() !== "") {
    cleaned.seoTitle = metadata.seoTitle
  }
  if (metadata.seoDescription && typeof metadata.seoDescription === "string" && metadata.seoDescription.trim() !== "") {
    cleaned.seoDescription = metadata.seoDescription
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
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
export function prepareCardSectionData(data: any): CreateCardSectionDto | null {
  if (!data) return null

  const { cards, ...sectionData } = data

  const prepared: CreateCardSectionDto = {
    title: sectionData.title,
    subtitle: cleanOptionalValue(sectionData.subtitle),
    description: cleanOptionalValue(sectionData.description),
    layout: sectionData.layout || undefined,
    backgroundColor: cleanOptionalValue(sectionData.backgroundColor),
    textColor: cleanOptionalValue(sectionData.textColor),
    maxCards: sectionData.maxCards || undefined,
    position: sectionData.position ?? 0,
    isActive: sectionData.isActive ?? true,
    styles: sectionData.styles || undefined,
    metadata: cleanMetadata(sectionData.metadata),
  }

  if (cards && cards.length > 0) {
    prepared.cards = cards.map((card: any): CardDto => {
      const cardMetadata = card.metadata ? cleanMetadata(card.metadata) : null
      
      // Validar linkUrl y linkText - si hay linkText debe haber linkUrl
      const linkUrl = cleanOptionalValue(card.linkUrl)
      const linkText = cleanOptionalValue(card.linkText)
      
      // Si hay linkText pero no linkUrl, omitir ambos
      const finalLinkUrl = linkText && !linkUrl ? undefined : linkUrl
      const finalLinkText = linkText && !linkUrl ? undefined : linkText
      
      return {
        title: card.title,
        subtitle: cleanOptionalValue(card.subtitle),
        description: cleanOptionalValue(card.description),
        imageUrl: cleanOptionalValue(card.imageUrl),
        linkUrl: finalLinkUrl,
        linkText: finalLinkText,
        backgroundColor: cleanOptionalValue(card.backgroundColor),
        textColor: cleanOptionalValue(card.textColor),
        position: card.position ?? 0,
        isActive: card.isActive ?? true,
        styles: card.styles || null,
        metadata: cardMetadata || null,
      }
    })
  }

  return removeUndefined(prepared) as CreateCardSectionDto
}

