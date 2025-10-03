import { Timestamps } from './common'

export interface ClientLogoSection extends Timestamps {
  id: string
  storeId: string
  title: string
  subtitle?: string | null
  description?: string | null
  layout?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  isActive: boolean
  position: number
  styles?: Record<string, any> | null
  metadata?: Record<string, any> | null
  clientLogos?: ClientLogo[]
}

export interface ClientLogo extends Timestamps {
  id: string
  clientLogoSectionId: string
  name: string
  company?: string | null
  logoUrl: string
  website?: string | null
  description?: string | null
  isActive: boolean
  isFeatured: boolean
  order: number
  styles?: Record<string, any> | null
  metadata?: Record<string, any> | null
}



