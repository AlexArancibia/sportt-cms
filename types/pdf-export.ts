import { Product } from './product'
import { ProductStatus } from './common'
import { Currency } from './currency'

// Layout types for PDF generation
export type PDFLayoutType = 'grid' | 'list' | 'table'

// Design configuration for PDF
export interface PDFExportConfig {
  primaryColor: string
  secondaryColor: string
  includeLogo: boolean
  layout: PDFLayoutType
  includeImages: boolean
  currencyId?: string // Currency ID to display prices in
  filterOnlyInStock?: boolean // Filter products with at least one variant with stock > 0
  filterPriceGreaterThanZero?: boolean // Filter products with at least one price > 0
}

// Filter configuration for products
export interface PDFFilterConfig {
  categoryIds?: string[]
  collectionIds?: string[]
  hasStock?: boolean
  minPrice?: number
  maxPrice?: number
  vendors?: string[]
  statuses?: ProductStatus[]
}

// Data structure for PDF template
export interface PDFTemplateData {
  storeName: string
  storeLogo?: string
  generatedDate: string
  products: Product[]
  totalProducts: number
  config: PDFExportConfig
  currency?: Currency
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
  }
  selectedCategorySlugs?: string[] // Category slugs from filters to group by
}

// Export options combining filters and design
export interface PDFExportOptions {
  filters: PDFFilterConfig
  design: PDFExportConfig
}

// Result of PDF generation
export interface PDFGenerationResult {
  success: boolean
  message?: string
  productsCount?: number
}

