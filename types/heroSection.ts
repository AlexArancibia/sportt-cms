export interface HeroSectionStyles {
  titleColor: string
  subtitleColor: string
  textAlign: string
  verticalAlign: string
  overlayColor: string
  buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost"
  buttonSize: "sm" | "default" | "lg"
  contentWidth: {
    mobile: string
    tablet: string
    desktop: string
  }
  contentPadding: {
    mobile: string
    tablet: string
    desktop: string
  }
  height: {
    mobile: string
    tablet: string
    desktop: string
  }
  titleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  subtitleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  textShadow: string
  animation: string
  backgroundPosition: string
  backgroundSize: string
}

export interface HeroSection {
  id: string
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  styles: Record<string, any>
  metadata?: Record<string, any>
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateHeroSectionDto {
  title: string
  subtitle?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  buttonText?: string
  buttonLink?: string
  styles: Record<string, any>
  metadata?: Record<string, any>
  isActive: boolean
}

export interface UpdateHeroSectionDto {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  styles?: Record<string, any>
  metadata?: Record<string, any>
  isActive?: boolean
}

