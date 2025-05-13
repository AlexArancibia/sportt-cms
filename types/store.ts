import type { User } from "./user"
import type { HeroSection } from "./heroSection"
import type { Currency } from "./currency"
import type { Category } from "./category"
import type { Product } from "./product"
import type { Collection } from "./collection"
import type { Order } from "./order"
import type { ShippingMethod } from "./shippingMethod"
import type { PaymentProvider } from "./payments"
import type { Coupon } from "./coupon"
import type { Content } from "./content"
import type { FrequentlyBoughtTogether } from "./fbt"
import type { CardSection } from "./card"
import type { TeamSection } from "./team"

export interface Store {
  id: string
  name: string
  slug: string
  owner: User
  ownerId: string
  isActive: boolean
  maxProducts?: number | null
  planType?: string | null
  planExpiryDate?: Date | null
  apiKeys?: any | null // Json type
  createdAt: Date
  updatedAt: Date

  // Relaciones
  settings?: ShopSettings
 
  categories?: Category[]
  products?: Product[]
  collections?: Collection[]
  orders?: Order[]
  shippingMethods?: ShippingMethod[]
  paymentProviders?: PaymentProvider[]
  coupons?: Coupon[]
  contents?: Content[]
  heroSections?: HeroSection[]
  cardSections?: CardSection[]
  teamSections?: TeamSection[]
  frequentlyBoughtTogether?: FrequentlyBoughtTogether[]
}

export interface ShopSettings {
  id: string
  storeId: string
  store?: Store
  name: string
  domain: string
  email?: string | null
  shopOwner?: string | null
  logo?: string | null
  description?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  provinceCode?: string | null
  country?: string | null
  countryCode?: string | null
  zip?: string | null
  phone?: string | null

  // Currency Settings
  defaultCurrency: Currency
  defaultCurrencyId: string
  acceptedCurrencies?: Currency[]
  multiCurrencyEnabled: boolean

  // Shipping Settings
  shippingZones?: string | null
  defaultShippingRate?: number | null
  freeShippingThreshold?: number | null

  // Tax Settings
  taxesIncluded: boolean
  taxValue?: number | null

  // Timezone & Measurement
  timezone?: string | null
  weightUnit?: string | null

  // Branding & Theme
  primaryColor?: string | null
  secondaryColor?: string | null
  theme?: string | null

  // Social Media
  facebookUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null

  // Analytics
  googleAnalyticsId?: string | null
  facebookPixelId?: string | null

  // Support
  supportEmail?: string | null
  supportPhone?: string | null
  liveChatEnabled: boolean

  // Status & Settings
  status: string
  maintenanceMode: boolean
  multiLanguageEnabled: boolean
  cookieConsentEnabled?: boolean | null
  gdprCompliant?: boolean | null
  ccpaCompliant?: boolean | null
  enableWishlist?: boolean | null
  webhooks?: any | null // Json type

  createdAt: Date
  updatedAt: Date
}

export interface CreateStoreDto {
  name: string
  slug: string
  ownerId: string
  isActive?: boolean // Tiene valor por defecto en el esquema
  maxProducts?: number | null
  planType?: string | null
  planExpiryDate?: Date | null
  apiKeys?: any | null
  initialSettings?: Partial<CreateShopSettingsDto>
}

export interface UpdateStoreDto {
  name?: string
  slug?: string
  isActive?: boolean
  maxProducts?: number | null
  planType?: string | null
  planExpiryDate?: Date | null
  apiKeys?: any | null
}

export interface CreateShopSettingsDto {
  storeId: string
  name: string
  domain: string
  defaultCurrencyId: string
  email?: string | null
  shopOwner?: string | null
  logo?: string | null
  description?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  provinceCode?: string | null
  country?: string | null
  countryCode?: string | null
  zip?: string | null
  phone?: string | null
  acceptedCurrencyIds?: string[] // IDs de monedas aceptadas
  multiCurrencyEnabled?: boolean // Tiene valor por defecto en el esquema
  shippingZones?: string | null
  defaultShippingRate?: number | null
  freeShippingThreshold?: number | null
  taxesIncluded?: boolean // Tiene valor por defecto en el esquema
  taxValue?: number | null
  timezone?: string | null
  weightUnit?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  theme?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  googleAnalyticsId?: string | null
  facebookPixelId?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  liveChatEnabled?: boolean // Tiene valor por defecto en el esquema
  status?: string // Tiene valor por defecto en el esquema
  maintenanceMode?: boolean // Tiene valor por defecto en el esquema
  multiLanguageEnabled?: boolean // Tiene valor por defecto en el esquema
  cookieConsentEnabled?: boolean | null
  gdprCompliant?: boolean | null
  ccpaCompliant?: boolean | null
  enableWishlist?: boolean | null
  webhooks?: any | null
}

export interface UpdateShopSettingsDto {
  name?: string
  domain?: string
  email?: string | null
  shopOwner?: string | null
  logo?: string | null
  description?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  provinceCode?: string | null
  country?: string | null
  countryCode?: string | null
  zip?: string | null
  phone?: string | null
  defaultCurrencyId?: string
  acceptedCurrencyIds?: string[] // IDs de monedas aceptadas
  multiCurrencyEnabled?: boolean
  shippingZones?: string | null
  defaultShippingRate?: number | null
  freeShippingThreshold?: number | null
  taxesIncluded?: boolean
  taxValue?: number | null
  timezone?: string | null
  weightUnit?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  theme?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  googleAnalyticsId?: string | null
  facebookPixelId?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  liveChatEnabled?: boolean
  status?: string
  maintenanceMode?: boolean
  multiLanguageEnabled?: boolean
  cookieConsentEnabled?: boolean | null
  gdprCompliant?: boolean | null
  ccpaCompliant?: boolean | null
  enableWishlist?: boolean | null
  webhooks?: any | null
}
