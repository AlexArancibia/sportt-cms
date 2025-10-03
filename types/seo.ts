import { Timestamps, SeoPageType, SeoRobotsDirective, SeoChangeFrequency } from './common'

export interface SeoConfig extends Timestamps {
  id: string
  storeId: string

  pageType: SeoPageType
  pageId?: string | null
  pageSlug?: string | null

  title?: string | null
  description?: string | null
  keywords: string[]
  canonicalUrl?: string | null
  robots: SeoRobotsDirective
  language?: string | null
  alternateLanguages?: any | null

  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  ogType?: string | null
  ogSiteName?: string | null
  ogLocale?: string | null

  twitterCard?: string | null
  twitterSite?: string | null
  twitterCreator?: string | null
  twitterImage?: string | null

  structuredData?: any | null

  googleAnalyticsId?: string | null
  googleTagManagerId?: string | null
  facebookPixelId?: string | null
  hotjarId?: string | null
  customTrackingScripts?: any | null

  sitemapUrl?: string | null
  robotsTxt?: string | null
  sitemapPriority?: number | null
  sitemapChangeFreq: SeoChangeFrequency

  preloadResources: string[]
  criticalCSS?: string | null
  lazyLoadImages: boolean
  webVitalsTracking: boolean

  customMetaTags?: any | null
  breadcrumbs?: any | null

  defaultTitle?: string | null
  defaultDescription?: string | null
  defaultKeywords: string[]
  faviconUrl?: string | null
  appleTouchIcon?: string | null

  hreflang?: any | null
  alternateUrls: string[]
  noindexPages: string[]
  nofollowPages: string[]

  isActive: boolean
  isDefault: boolean
  priority: number
}



