/**
 * Utilidades compartidas para generar payloads de productos
 * Usadas por ProductForm (edición completa) y QuickEditDialog (edición rápida)
 */

import type { CreateVariantPriceDto } from "@/types/variantPrice"
import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { Currency } from "@/types/currency"

// ============================================================================
// TIPOS
// ============================================================================

export interface PricePayload {
  currencyId: string
  price: number
  originalPrice?: number
}

export interface VariantPayload {
  title: string
  prices: PricePayload[]
  sku?: string
  imageUrls?: string[]
  inventoryQuantity?: number
  weightValue?: number
  isActive?: boolean
  position?: number
  attributes?: Record<string, string>
}

export interface ShopSettingsWithCurrencies {
  acceptedCurrencies?: Currency[]
}

// ============================================================================
// FUNCIONES DE REDONDEO/FORMATEO
// ============================================================================

/**
 * Redondea un precio a 2 decimales de forma segura.
 * Maneja strings, nulls, undefined y NaN.
 */
export function safeRoundPrice(priceValue: number | string | null | undefined): number {
  if (priceValue === null || priceValue === undefined) return 0
  const numValue = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue
  if (isNaN(numValue)) return 0
  return parseFloat(numValue.toFixed(2))
}

// ============================================================================
// FUNCIONES DE FILTRADO
// ============================================================================

/**
 * Filtra valores vacíos (null, undefined, strings vacíos, arrays vacíos) de un objeto.
 * Aplica recursivamente a objetos anidados.
 */
export function filterEmptyValues(obj: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    // Filtrar valores null, undefined y strings vacíos
    if (value === null || value === undefined || value === "") {
      continue
    }
    
    // Las fechas (Date) son objetos pero deben incluirse siempre
    if (value instanceof Date) {
      filtered[key] = value
      continue
    }
    
    if (Array.isArray(value)) {
      // Solo incluir arrays que no estén vacíos
      if (value.length > 0) {
        filtered[key] = value
      }
    } else if (typeof value === "object" && value !== null) {
      // Para objetos, aplicar recursivamente el filtrado
      const filteredObj = filterEmptyValues(value as Record<string, unknown>)
      if (Object.keys(filteredObj).length > 0) {
        filtered[key] = filteredObj
      }
    } else {
      // Para valores primitivos, incluir si no están vacíos
      filtered[key] = value
    }
  }
  
  return filtered
}

// ============================================================================
// FUNCIONES DE COMPARACIÓN
// ============================================================================

/**
 * Compara datos originales con actuales y retorna solo los campos que cambiaron.
 * Usado para generar payloads PATCH con solo los cambios.
 */
export function getChangedFields(
  original: Record<string, unknown>, 
  current: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(current)) {
    const originalValue = original[key]
    
    // Manejo especial para fechas
    if (key === 'releaseDate') {
      const normalizeDate = (date: unknown): string | null => {
        if (date instanceof Date) {
          return date.toISOString()
        }
        if (typeof date === 'string') {
          return new Date(date).toISOString()
        }
        return null
      }
      
      const normalizedOriginal = normalizeDate(originalValue)
      const normalizedCurrent = normalizeDate(value)
      
      if (normalizedOriginal !== normalizedCurrent) {
        changes[key] = value
      }
    } else if (key === 'variants') {
      // Solo comparar variantes si realmente han cambiado
      const originalVariants = Array.isArray(originalValue) ? originalValue : []
      const currentVariants = Array.isArray(value) ? value : []
      
      // Si el número de variantes cambió, incluir todas
      if (originalVariants.length !== currentVariants.length) {
        changes[key] = currentVariants
      } else {
        // Comparar cada variante individualmente
        const hasChanges = currentVariants.some((currentVariant: unknown, index: number) => {
          const originalVariant = originalVariants[index]
          if (!originalVariant) return true
          
          // Crear objetos limpios para comparación
          const cleanCurrent = {
            title: (currentVariant as Record<string, unknown>).title,
            sku: (currentVariant as Record<string, unknown>).sku,
            imageUrls: (currentVariant as Record<string, unknown>).imageUrls,
            inventoryQuantity: (currentVariant as Record<string, unknown>).inventoryQuantity,
            weightValue: (currentVariant as Record<string, unknown>).weightValue,
            isActive: (currentVariant as Record<string, unknown>).isActive,
            position: (currentVariant as Record<string, unknown>).position,
            attributes: (currentVariant as Record<string, unknown>).attributes,
            prices: (currentVariant as Record<string, unknown>).prices
          }
          
          const cleanOriginal = {
            title: (originalVariant as Record<string, unknown>).title,
            sku: (originalVariant as Record<string, unknown>).sku,
            imageUrls: (originalVariant as Record<string, unknown>).imageUrls,
            inventoryQuantity: (originalVariant as Record<string, unknown>).inventoryQuantity,
            weightValue: (originalVariant as Record<string, unknown>).weightValue,
            isActive: (originalVariant as Record<string, unknown>).isActive,
            position: (originalVariant as Record<string, unknown>).position,
            attributes: (originalVariant as Record<string, unknown>).attributes,
            prices: (originalVariant as Record<string, unknown>).prices
          }
          
          return JSON.stringify(cleanCurrent) !== JSON.stringify(cleanOriginal)
        })
        
        if (hasChanges) {
          changes[key] = currentVariants
        }
      }
    } else {
      // Comparación normal para otros campos
      if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
        changes[key] = value
      }
    }
  }
  
  return changes
}

// ============================================================================
// FUNCIONES DE CONSTRUCCIÓN DE PRECIOS
// ============================================================================

/**
 * Construye el array de precios para una variante, asegurando que todas las
 * monedas aceptadas estén presentes.
 * 
 * @param variantPrices - Precios actuales de la variante
 * @param acceptedCurrencies - Monedas aceptadas de shopSettings
 * @param fallbackCurrencies - Monedas de fallback si no hay acceptedCurrencies
 */
export function buildVariantPrices(
  variantPrices: CreateVariantPriceDto[] | undefined,
  acceptedCurrencies: Currency[] | null,
  fallbackCurrencies: Currency[] | null
): PricePayload[] {
  // Crear mapa de precios existentes por currencyId
  const priceByCurrency: Record<string, CreateVariantPriceDto | undefined> = {}
  ;(variantPrices || []).forEach((p) => {
    priceByCurrency[p.currencyId] = p
  })

  // Usar monedas aceptadas si existen
  if (acceptedCurrencies && acceptedCurrencies.length > 0) {
    return acceptedCurrencies.map((currency) => {
      const existing = priceByCurrency[currency.id]
      const mapped: PricePayload = {
        currencyId: currency.id,
        price: safeRoundPrice(existing?.price),
      }
      if (existing && existing.originalPrice != null && existing.originalPrice > 0) {
        mapped.originalPrice = safeRoundPrice(existing.originalPrice)
      }
      return mapped
    })
  }
  
  // Usar monedas de fallback si existen
  if (fallbackCurrencies && fallbackCurrencies.length > 0) {
    return fallbackCurrencies.map((currency) => {
      const existing = priceByCurrency[currency.id]
      const mapped: PricePayload = {
        currencyId: currency.id,
        price: safeRoundPrice(existing?.price),
      }
      if (existing && existing.originalPrice != null && existing.originalPrice > 0) {
        mapped.originalPrice = safeRoundPrice(existing.originalPrice)
      }
      return mapped
    })
  }
  
  // Fallback: usar solo los precios definidos en la variante
  return (variantPrices || []).map((price) => {
    const mapped: PricePayload = {
      currencyId: price.currencyId,
      price: safeRoundPrice(price.price),
    }
    if (price.originalPrice != null && price.originalPrice > 0) {
      mapped.originalPrice = safeRoundPrice(price.originalPrice)
    }
    return mapped
  })
}

// ============================================================================
// FUNCIONES DE LIMPIEZA DE VARIANTES
// ============================================================================

export interface CleanVariantOptions {
  /** Total de variantes (para determinar si forzar isActive) */
  totalVariants: number
  /** Si es producto simple (sin variantes múltiples) */
  isSimpleProduct: boolean
  /** Monedas aceptadas de shopSettings */
  acceptedCurrencies: Currency[] | null
  /** Monedas de fallback */
  fallbackCurrencies: Currency[] | null
}

/**
 * Limpia una variante para el payload del backend.
 * - NO incluye el campo 'id' (el backend identifica por posición)
 * - Solo incluye campos opcionales si tienen valores válidos
 * - Fuerza isActive=true si hay una sola variante
 * - Añade attributes: { type: "simple" } para productos simples
 */
export function cleanVariantForPayload(
  variant: UpdateProductVariantDto,
  options: CleanVariantOptions
): VariantPayload {
  const { totalVariants, isSimpleProduct, acceptedCurrencies, fallbackCurrencies } = options
  
  const cleaned: VariantPayload = {
    title: variant.title || "",
    prices: buildVariantPrices(variant.prices, acceptedCurrencies, fallbackCurrencies)
  }
  
  // Solo incluir campos opcionales si tienen valores válidos
  if (variant.sku && variant.sku.trim() !== "") {
    cleaned.sku = variant.sku
  }
  if (variant.imageUrls && variant.imageUrls.length > 0) {
    cleaned.imageUrls = variant.imageUrls
  }
  if (variant.inventoryQuantity !== undefined && variant.inventoryQuantity !== null) {
    cleaned.inventoryQuantity = Number(variant.inventoryQuantity)
  }
  if (variant.weightValue !== undefined && variant.weightValue !== null) {
    cleaned.weightValue = Number(variant.weightValue)
  }
  
  // Si es una sola variante, forzar isActive a true
  if (totalVariants === 1) {
    cleaned.isActive = true
  } else if (variant.isActive !== undefined) {
    cleaned.isActive = variant.isActive
  }
  
  if (variant.position !== undefined && variant.position !== null) {
    cleaned.position = Number(variant.position)
  }
  
  // Manejar attributes
  if (variant.attributes && Object.keys(variant.attributes).length > 0) {
    cleaned.attributes = variant.attributes
  } else if (isSimpleProduct) {
    cleaned.attributes = { type: "simple" }
  }

  return cleaned
}

// ============================================================================
// FUNCIONES DE PREPARACIÓN DE DATOS PARA COMPARACIÓN
// ============================================================================

/**
 * Prepara los datos de una variante para comparación (sin campos que no deben compararse).
 * Usado tanto para detectar cambios como para hasUnsavedChanges.
 */
export function prepareVariantForComparison(
  variant: UpdateProductVariantDto,
  acceptedCurrencies: Currency[] | null,
  fallbackCurrencies: Currency[] | null
): Record<string, unknown> {
  return {
    title: variant.title,
    sku: variant.sku,
    imageUrls: variant.imageUrls,
    inventoryQuantity: variant.inventoryQuantity,
    weightValue: variant.weightValue,
    isActive: variant.isActive,
    position: variant.position,
    attributes: variant.attributes,
    prices: buildVariantPrices(variant.prices, acceptedCurrencies, fallbackCurrencies),
  }
}

/**
 * Extrae las monedas aceptadas de shopSettings.
 */
export function getAcceptedCurrencies(
  shopSettings: unknown
): Currency[] | null {
  if (!Array.isArray(shopSettings)) return null
  if (shopSettings.length === 0) return null
  
  const first = shopSettings[0] as ShopSettingsWithCurrencies | undefined
  if (!first) return null
  
  if (first.acceptedCurrencies && 
      Array.isArray(first.acceptedCurrencies) && 
      first.acceptedCurrencies.length > 0) {
    return first.acceptedCurrencies
  }
  
  return null
}
