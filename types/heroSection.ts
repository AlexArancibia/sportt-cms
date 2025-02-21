export interface HeroSection {
  id: string
  title: string
  subtitle?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  buttonText?: string
  buttonLink?: string
  styles?: Record<string, any>
  metadata?: Record<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateHeroSectionDto {
  title: string
  subtitle?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  buttonText?: string
  buttonLink?: string
  styles?: Record<string, any>
  metadata?: Record<string, any>
  isActive: boolean
}

export interface UpdateHeroSectionDto {
  title?: string
  subtitle?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  buttonText?: string
  buttonLink?: string
  styles?: Record<string, any>
  metadata?: Record<string, any>
  isActive?: boolean
}

