export interface CardSectionStyles {
  layout: "grid" | "carousel" | "masonry" | "flex"
  gridColumns?: {
    mobile: number
    tablet: number
    desktop: number
  }
  gap?: string
  padding?: string
  margin?: string
  carouselOptions?: {
    autoplay?: boolean
    loop?: boolean
    arrows?: boolean
    dots?: boolean
  }
}

export interface CardSectionMetadata {
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
}

export interface CardSection {
  id: string
  storeId: string
  title: string
  subtitle?: string | null
  description?: string | null
  layout?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  maxCards?: number | null
  isActive: boolean
  position: number
  styles?: CardSectionStyles | null
  metadata?: CardSectionMetadata | null
  cards?: Card[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateCardSectionDto {
  storeId: string
  title: string
  subtitle?: string
  description?: string
  layout?: string
  backgroundColor?: string
  textColor?: string
  maxCards?: number
  position?: number
  styles?: CardSectionStyles
  metadata?: CardSectionMetadata
  isActive?: boolean
  cards?: Card[] // Added cards property to match the form structure
}

export interface UpdateCardSectionDto {
  title?: string
  subtitle?: string | null
  description?: string | null
  layout?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  maxCards?: number | null
  position?: number
  styles?: CardSectionStyles | null
  metadata?: CardSectionMetadata | null
  isActive?: boolean
  cards?: Card[] // Added cards property to match the form structure
}

export interface CardStyles {
  border?: string
  shadow?: string
  borderRadius?: string
  padding?: string
  margin?: string
  hoverEffect?: "none" | "scale" | "shadow" | "fade"
  textAlign?: "left" | "center" | "right"
}

export interface CardMetadata {
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  visibility?: {
    mobile: boolean
    tablet: boolean
    desktop: boolean
  }
}

export interface Card {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  linkUrl?: string | null
  linkText?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  position: number
  cardSectionId: string
  styles?: CardStyles | null
  metadata?: CardMetadata | null
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateCardDto {
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  linkText?: string
  backgroundColor?: string
  textColor?: string
  position?: number
  cardSectionId: string
  styles?: CardStyles
  metadata?: CardMetadata
  isActive?: boolean
}

export interface UpdateCardDto {
  title?: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  linkUrl?: string | null
  linkText?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  position?: number
  styles?: CardStyles | null
  metadata?: CardMetadata | null
  isActive?: boolean
}
