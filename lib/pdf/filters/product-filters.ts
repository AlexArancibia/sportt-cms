import { Product } from '@/types/product'
import { PDFFilterConfig } from '@/types/pdf-export'
import { ProductStatus } from '@/types/common'

/**
 * Filter products by selected categories
 */
export function filterByCategories(products: Product[], categoryIds?: string[]): Product[] {
  if (!categoryIds || categoryIds.length === 0) {
    return products
  }

  return products.filter(product => {
    if (!product.categories || product.categories.length === 0) {
      return false
    }
    return product.categories.some(cat => categoryIds.includes(cat.id))
  })
}

/**
 * Filter products by selected collections
 */
export function filterByCollections(products: Product[], collectionIds?: string[]): Product[] {
  if (!collectionIds || collectionIds.length === 0) {
    return products
  }

  return products.filter(product => {
    if (!product.collections || product.collections.length === 0) {
      return false
    }
    return product.collections.some(col => collectionIds.includes(col.id))
  })
}

/**
 * Filter products by stock availability
 */
export function filterByStock(products: Product[], hasStock?: boolean): Product[] {
  if (hasStock === undefined || hasStock === null) {
    return products
  }

  return products.filter(product => {
    if (!product.variants || product.variants.length === 0) {
      return false
    }
    
    const totalStock = product.variants.reduce((sum, variant) => {
      return sum + (variant.inventoryQuantity || 0)
    }, 0)

    return hasStock ? totalStock > 0 : totalStock === 0
  })
}

/**
 * Filter products by price range
 */
export function filterByPriceRange(
  products: Product[],
  minPrice?: number,
  maxPrice?: number,
  currencyId?: string
): Product[] {
  if (minPrice === undefined && maxPrice === undefined) {
    return products
  }

  return products.filter(product => {
    if (!product.variants || product.variants.length === 0) {
      return false
    }

    // Get the minimum price from variants (using first price if available)
    const prices = product.variants
      .map(v => v.prices && v.prices.length > 0 ? v.prices[0].price : 0)
      .filter(p => p > 0)
    
    if (prices.length === 0) {
      return false
    }
    
    const productMinPrice = Math.min(...prices)

    if (minPrice !== undefined && productMinPrice < minPrice) {
      return false
    }

    if (maxPrice !== undefined && productMinPrice > maxPrice) {
      return false
    }

    return true
  })
}

/**
 * Filter products by vendors
 */
export function filterByVendor(products: Product[], vendors?: string[]): Product[] {
  if (!vendors || vendors.length === 0) {
    return products
  }

  return products.filter(product => {
    if (!product.vendor) {
      return false
    }
    return vendors.includes(product.vendor)
  })
}

/**
 * Filter products by status
 */
export function filterByStatus(products: Product[], statuses?: ProductStatus[]): Product[] {
  if (!statuses || statuses.length === 0) {
    return products
  }

  return products.filter(product => statuses.includes(product.status))
}

/**
 * Apply all filters to products
 * Main function to use when filtering products for PDF export
 */
export function applyAllFilters(products: Product[], filterConfig: PDFFilterConfig): Product[] {
  let filteredProducts = [...products]

  // Apply each filter sequentially
  filteredProducts = filterByCategories(filteredProducts, filterConfig.categoryIds)
  filteredProducts = filterByCollections(filteredProducts, filterConfig.collectionIds)
  filteredProducts = filterByStock(filteredProducts, filterConfig.hasStock)
  filteredProducts = filterByPriceRange(
    filteredProducts,
    filterConfig.minPrice,
    filterConfig.maxPrice
  )
  filteredProducts = filterByVendor(filteredProducts, filterConfig.vendors)
  filteredProducts = filterByStatus(filteredProducts, filterConfig.statuses)

  return filteredProducts
}

/**
 * Get filter summary for display
 * Returns a human-readable summary of active filters
 */
export function getFilterSummary(filterConfig: PDFFilterConfig): string[] {
  const summary: string[] = []

  if (filterConfig.categoryIds && filterConfig.categoryIds.length > 0) {
    summary.push(`${filterConfig.categoryIds.length} categoría(s)`)
  }

  if (filterConfig.collectionIds && filterConfig.collectionIds.length > 0) {
    summary.push(`${filterConfig.collectionIds.length} colección(es)`)
  }

  if (filterConfig.hasStock !== undefined) {
    summary.push(filterConfig.hasStock ? 'Con stock' : 'Sin stock')
  }

  if (filterConfig.minPrice !== undefined || filterConfig.maxPrice !== undefined) {
    const min = filterConfig.minPrice || 0
    const max = filterConfig.maxPrice || '∞'
    summary.push(`Precio: $${min} - $${max}`)
  }

  if (filterConfig.vendors && filterConfig.vendors.length > 0) {
    summary.push(`${filterConfig.vendors.length} proveedor(es)`)
  }

  if (filterConfig.statuses && filterConfig.statuses.length > 0) {
    summary.push(`${filterConfig.statuses.length} estado(s)`)
  }

  return summary.length > 0 ? summary : ['Sin filtros aplicados']
}

