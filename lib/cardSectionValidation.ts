import type { CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"

export interface CardSectionValidationError {
  path: string
  message: string
}

const SECTION_TITLE_MAX = 200
const SECTION_SUBTITLE_MAX = 300
const SECTION_DESCRIPTION_MAX = 1000
const CARD_TITLE_MAX = 200
const CARD_SUBTITLE_MAX = 300
const CARD_DESCRIPTION_MAX = 1000
const CARD_LINK_TEXT_MAX = 50

const isPresent = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch (error) {
    return false
  }
}

const pushError = (
  errors: CardSectionValidationError[],
  path: string,
  message: string,
) => {
  errors.push({ path, message })
}

export function validateCardSection(
  data: Partial<CreateCardSectionDto | UpdateCardSectionDto> | null | undefined,
): CardSectionValidationError[] {
  const errors: CardSectionValidationError[] = []

  if (!data) {
    pushError(errors, "section", "No se proporcionaron datos para la sección.")
    return errors
  }

  const title = typeof data.title === "string" ? data.title.trim() : ""
  if (!title) {
    pushError(errors, "title", "El título de la sección es obligatorio.")
  } else if (title.length > SECTION_TITLE_MAX) {
    pushError(errors, "title", `El título no debe exceder ${SECTION_TITLE_MAX} caracteres.`)
  }

  if (isPresent(data.subtitle)) {
    const subtitle = data.subtitle.trim()
    if (subtitle.length > SECTION_SUBTITLE_MAX) {
      pushError(errors, "subtitle", `El subtítulo no debe exceder ${SECTION_SUBTITLE_MAX} caracteres.`)
    }
  }

  if (isPresent(data.description)) {
    const description = data.description.trim()
    if (description.length > SECTION_DESCRIPTION_MAX) {
      pushError(errors, "description", `La descripción no debe exceder ${SECTION_DESCRIPTION_MAX} caracteres.`)
    }
  }

  const cards = Array.isArray(data.cards) ? data.cards : []

  if (cards.length === 0) {
    pushError(errors, "cards", "Debe añadir al menos una tarjeta antes de guardar.")
    return errors
  }

  cards.forEach((card, index) => {
    const cardPath = `cards[${index}]`

    if (!card) {
      pushError(errors, cardPath, "La tarjeta no contiene información válida.")
      return
    }

    const cardTitle = typeof card.title === "string" ? card.title.trim() : ""
    if (!cardTitle) {
      pushError(errors, `${cardPath}.title`, "El título de la tarjeta es obligatorio.")
    } else if (cardTitle.length > CARD_TITLE_MAX) {
      pushError(
        errors,
        `${cardPath}.title`,
        `El título de la tarjeta no debe exceder ${CARD_TITLE_MAX} caracteres.`,
      )
    }

    if (isPresent(card.subtitle)) {
      const subtitle = card.subtitle!.trim()
      if (subtitle.length > CARD_SUBTITLE_MAX) {
        pushError(
          errors,
          `${cardPath}.subtitle`,
          `El subtítulo de la tarjeta no debe exceder ${CARD_SUBTITLE_MAX} caracteres.`,
        )
      }
    }

    if (isPresent(card.description)) {
      const description = card.description!.trim()
      if (description.length > CARD_DESCRIPTION_MAX) {
        pushError(
          errors,
          `${cardPath}.description`,
          `La descripción de la tarjeta no debe exceder ${CARD_DESCRIPTION_MAX} caracteres.`,
        )
      }
    }

    if (isPresent(card.imageUrl) && !isValidHttpUrl(card.imageUrl!.trim())) {
      pushError(errors, `${cardPath}.imageUrl`, "La URL de la imagen debe ser válida (http o https).")
    }

    if (isPresent(card.linkUrl)) {
      const linkUrl = card.linkUrl!.trim()
      if (!isValidHttpUrl(linkUrl)) {
        pushError(errors, `${cardPath}.linkUrl`, "El enlace debe ser una URL válida (http o https).")
      }
    }

    if (isPresent(card.linkText)) {
      const linkText = card.linkText!.trim()
      if (linkText.length > CARD_LINK_TEXT_MAX) {
        pushError(
          errors,
          `${cardPath}.linkText`,
          `El texto del enlace no debe exceder ${CARD_LINK_TEXT_MAX} caracteres.`,
        )
      }
    }

    if (isPresent(card.videoUrl) && !isValidHttpUrl(card.videoUrl!.trim())) {
      pushError(errors, `${cardPath}.videoUrl`, "El video debe ser una URL válida (http o https).")
    }
  })

  return errors
}

export const groupCardSectionErrors = (errors: CardSectionValidationError[]) => {
  const section: Record<string, string[]> = {}
  const cardsGeneral: string[] = []
  const cards: Record<number, Record<string, string[]>> = {}

  errors.forEach((error) => {
    const match = error.path.match(/^cards\[(\d+)\](?:\.(.+))?$/)

    if (match) {
      const index = Number.parseInt(match[1], 10)
      const field = match[2] || "_self"

      if (!cards[index]) {
        cards[index] = {}
      }

      if (!cards[index][field]) {
        cards[index][field] = []
      }

      cards[index][field].push(error.message)
      return
    }

    if (error.path === "cards") {
      cardsGeneral.push(error.message)
      return
    }

    if (!section[error.path]) {
      section[error.path] = []
    }

    section[error.path].push(error.message)
  })

  return { section, cardsGeneral, cards }
}

