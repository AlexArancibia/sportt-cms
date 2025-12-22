import { PDFTemplateData } from '@/types/pdf-export'
import { Product } from '@/types/product'
import { formatPrice } from '@/lib/utils'
import { getPDFStyles } from './pdf-styles'

/**
 * Groups products by category and collection
 * Priority: Categories first, then collections, then uncategorized
 * If selectedCategorySlugs is provided, only groups by those categories
 */
function groupProducts(products: Product[], selectedCategorySlugs?: string[]): {
  byCategory: Map<string, Product[]>
  byCollection: Map<string, Product[]>
  uncategorized: Product[]
} {
  const byCategory = new Map<string, Product[]>()
  const byCollection = new Map<string, Product[]>()
  const uncategorized: Product[] = []
  const processedProducts = new Set<string>()

  // First pass: Group by categories (priority)
  // If selectedCategorySlugs is provided, only group by those categories
  products.forEach(product => {
    if (product.categories && product.categories.length > 0) {
      // Filter categories to only those in selectedCategorySlugs (if provided)
      const categoriesToUse = selectedCategorySlugs && selectedCategorySlugs.length > 0
        ? product.categories.filter(cat => selectedCategorySlugs.includes(cat.slug))
        : product.categories

      if (categoriesToUse.length > 0) {
        categoriesToUse.forEach(category => {
          if (!byCategory.has(category.name)) {
            byCategory.set(category.name, [])
          }
          byCategory.get(category.name)!.push(product)
          processedProducts.add(product.id)
        })
      }
    }
  })

  // Second pass: Group by collections (only products not in categories)
  products.forEach(product => {
    if (!processedProducts.has(product.id) && product.collections && product.collections.length > 0) {
      product.collections.forEach(collection => {
        if (!byCollection.has(collection.title)) {
          byCollection.set(collection.title, [])
        }
        byCollection.get(collection.title)!.push(product)
        processedProducts.add(product.id)
      })
    }
  })

  // Third pass: Uncategorized products
  products.forEach(product => {
    if (!processedProducts.has(product.id)) {
      uncategorized.push(product)
    }
  })

  return { byCategory, byCollection, uncategorized }
}

/**
 * Generates HTML template for product catalog PDF
 */
export const generateProductCatalogHTML = (data: PDFTemplateData): string => {
  const { storeName, storeLogo, products, totalProducts, config, currency, selectedCategorySlugs } = data
  const { layout, includeImages, primaryColor, secondaryColor, includeLogo } = config

  const styles = getPDFStyles(primaryColor, secondaryColor)

  // Simplified header
  const headerHTML = `
    <div class="pdf-header">
      <div class="pdf-header-left">
        ${includeLogo && storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="pdf-logo" />` : ''}
        <div>
          <h1 class="pdf-title">${storeName}</h1>
          <p class="pdf-subtitle">Catálogo de Productos</p>
        </div>
      </div>
      <div class="pdf-header-right">
        <p class="pdf-count">${totalProducts} producto${totalProducts !== 1 ? 's' : ''}</p>
      </div>
    </div>
  `

  // Group products - pass selectedCategorySlugs to filter categories
  const { byCategory, byCollection, uncategorized } = groupProducts(products, selectedCategorySlugs)

  let productsHTML = ''

  if (layout === 'grid') {
    productsHTML = generateGridLayoutGrouped(byCategory, byCollection, uncategorized, includeImages, currency)
  } else if (layout === 'list') {
    productsHTML = generateListLayoutGrouped(byCategory, byCollection, uncategorized, includeImages, currency)
  } else if (layout === 'table') {
    productsHTML = generateTableLayoutGrouped(byCategory, byCollection, uncategorized, includeImages, currency)
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${storeName} - Catálogo de Productos</title>
      ${styles}
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      ${headerHTML}
      ${productsHTML}
    </body>
    </html>
  `
}

/**
 * Generate product card with variants grouped
 */
function generateProductCard(product: Product, includeImages: boolean, currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }): string {
  const imageUrl = includeImages && product.imageUrls?.[0] ? product.imageUrls[0] : null
  const variants = product.variants || []
  const hasMultipleVariants = variants.length > 1
  
  // Get price range or single price
  let priceDisplay = ''
  if (variants.length > 0) {
    const prices = variants
      .flatMap(v => v.prices || [])
      .map(p => p.price)
      .filter(p => p > 0)
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      if (minPrice === maxPrice) {
        priceDisplay = formatPrice(minPrice, currency)
      } else {
        priceDisplay = `${formatPrice(minPrice, currency)} - ${formatPrice(maxPrice, currency)}`
      }
    }
  }

  // Calculate total stock
  const totalStock = variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0)

  return `
    <div class="product-card">
      ${imageUrl ? 
        `<div class="product-card-image-wrapper"><img src="${imageUrl}" alt="${product.title}" class="product-card-image" onerror="this.style.display='none'" /></div>` : 
        includeImages ? `<div class="product-card-image-wrapper"><div class="product-card-image no-image-placeholder">Sin imagen</div></div>` : ''
      }
      <div class="product-card-content">
        <h3 class="product-card-title">${product.title}</h3>
        ${product.vendor ? `<p class="product-card-vendor">${product.vendor}</p>` : ''}
        
        ${hasMultipleVariants ? `
          <div class="product-variants">
            ${variants.map(v => {
              const variantPrice = v.prices?.[0]?.price || 0
              return `
                <div class="product-variant-item">
                  <div class="variant-info-row">
                    <span class="variant-title">${v.title}</span>
                    <span class="variant-price">${formatPrice(variantPrice, currency)}</span>
                  </div>
                  <div class="variant-meta">
                    ${v.sku ? `<span class="variant-sku">SKU: ${v.sku}</span>` : ''}
                    <span class="variant-stock">Stock: ${v.inventoryQuantity || 0}</span>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        ` : `
          <div class="product-simple-info">
            <div class="simple-meta">
              ${variants[0]?.sku ? `<span class="simple-sku">SKU: ${variants[0].sku}</span>` : ''}
              <span class="simple-stock">Stock: ${totalStock}</span>
            </div>
            <p class="product-card-price">${priceDisplay}</p>
          </div>
        `}
      </div>
    </div>
  `
}

/**
 * Generate grid layout with grouping
 */
function generateGridLayoutGrouped(
  byCategory: Map<string, Product[]>,
  byCollection: Map<string, Product[]>,
  uncategorized: Product[],
  includeImages: boolean,
  currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }
): string {
  let html = ''

  // Products grouped by category
  byCategory.forEach((categoryProducts, categoryName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title">${categoryName}</h2>
        <div class="products-grid">
          ${categoryProducts.map(product => generateProductCard(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  })

  // Products grouped by collection
  byCollection.forEach((collectionProducts, collectionName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title collection-title">${collectionName}</h2>
        <div class="products-grid">
          ${collectionProducts.map(product => generateProductCard(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  })

  // Uncategorized products
  if (uncategorized.length > 0) {
    html += `
      <div class="product-section">
        <h2 class="section-title">Otros Productos</h2>
        <div class="products-grid">
          ${uncategorized.map(product => generateProductCard(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  }

  return html
}

/**
 * Generate list layout with grouping
 */
function generateListLayoutGrouped(
  byCategory: Map<string, Product[]>,
  byCollection: Map<string, Product[]>,
  uncategorized: Product[],
  includeImages: boolean,
  currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }
): string {
  let html = ''

  // Products grouped by category
  byCategory.forEach((categoryProducts, categoryName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title">${categoryName}</h2>
        <div class="products-list">
          ${categoryProducts.map(product => generateProductListItem(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  })

  // Products grouped by collection
  byCollection.forEach((collectionProducts, collectionName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title collection-title">${collectionName}</h2>
        <div class="products-list">
          ${collectionProducts.map(product => generateProductListItem(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  })

  // Uncategorized products
  if (uncategorized.length > 0) {
    html += `
      <div class="product-section">
        <h2 class="section-title">Otros Productos</h2>
        <div class="products-list">
          ${uncategorized.map(product => generateProductListItem(product, includeImages, currency)).join('')}
        </div>
      </div>
    `
  }

  return html
}

/**
 * Generate list item for product
 */
function generateProductListItem(product: Product, includeImages: boolean, currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }): string {
  const imageUrl = includeImages && product.imageUrls?.[0] ? product.imageUrls[0] : null
  const variants = product.variants || []
  const hasMultipleVariants = variants.length > 1
  
  const totalStock = variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0)

  return `
    <div class="product-row">
      ${imageUrl ? 
        `<div class="product-row-image-wrapper"><img src="${imageUrl}" alt="${product.title}" class="product-row-image" onerror="this.style.display='none'" /></div>` : 
        includeImages ? `<div class="product-row-image-wrapper"><div class="product-row-image no-image-placeholder">Sin imagen</div></div>` : ''
      }
      <div class="product-row-content">
        <div class="product-row-header">
          <h3 class="product-row-title">${product.title}</h3>
          ${product.vendor ? `<p class="product-row-vendor">${product.vendor}</p>` : ''}
        </div>
        ${hasMultipleVariants ? `
          <div class="product-variants-list">
            ${variants.map(v => {
              const variantPrice = v.prices?.[0]?.price || 0
              return `
                <div class="variant-row">
                  <span class="variant-name">${v.title}</span>
                  ${v.sku ? `<span class="variant-info">SKU: ${v.sku}</span>` : ''}
                  <span class="variant-info">Stock: ${v.inventoryQuantity || 0}</span>
                  <span class="variant-price">${formatPrice(variantPrice, currency)}</span>
                </div>
              `
            }).join('')}
          </div>
        ` : `
          <div class="product-row-simple">
            <div class="product-row-meta">
              ${variants[0]?.sku ? `<span>SKU: ${variants[0].sku}</span>` : ''}
              <span>Stock: ${totalStock}</span>
            </div>
            <div class="product-row-price">${formatPrice(variants[0]?.prices?.[0]?.price || 0, currency)}</div>
          </div>
        `}
      </div>
    </div>
  `
}

/**
 * Generate table layout with grouping
 */
function generateTableLayoutGrouped(
  byCategory: Map<string, Product[]>,
  byCollection: Map<string, Product[]>,
  uncategorized: Product[],
  includeImages: boolean,
  currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }
): string {
  let html = ''

  // Products grouped by category
  byCategory.forEach((categoryProducts, categoryName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title">${categoryName}</h2>
        <table class="products-table">
          <thead>
            <tr>
              ${includeImages ? '<th class="th-image">Imagen</th>' : ''}
              <th>Producto</th>
              <th>Variante</th>
              <th>SKU</th>
              <th>Marca</th>
              <th class="th-stock">Stock</th>
              <th class="th-price">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${categoryProducts.flatMap(product => generateProductTableRows(product, includeImages, currency)).join('')}
          </tbody>
        </table>
      </div>
    `
  })

  // Products grouped by collection
  byCollection.forEach((collectionProducts, collectionName) => {
    html += `
      <div class="product-section">
        <h2 class="section-title collection-title">${collectionName}</h2>
        <table class="products-table">
          <thead>
            <tr>
              ${includeImages ? '<th class="th-image">Imagen</th>' : ''}
              <th>Producto</th>
              <th>Variante</th>
              <th>SKU</th>
              <th>Marca</th>
              <th class="th-stock">Stock</th>
              <th class="th-price">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${collectionProducts.flatMap(product => generateProductTableRows(product, includeImages, currency)).join('')}
          </tbody>
        </table>
      </div>
    `
  })

  // Uncategorized products
  if (uncategorized.length > 0) {
    html += `
      <div class="product-section">
        <h2 class="section-title">Otros Productos</h2>
        <table class="products-table">
          <thead>
            <tr>
              ${includeImages ? '<th class="th-image">Imagen</th>' : ''}
              <th>Producto</th>
              <th>Variante</th>
              <th>SKU</th>
              <th>Marca</th>
              <th class="th-stock">Stock</th>
              <th class="th-price">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${uncategorized.flatMap(product => generateProductTableRows(product, includeImages, currency)).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  return html
}

/**
 * Generate table rows for a product (one row per variant)
 */
function generateProductTableRows(product: Product, includeImages: boolean, currency?: { symbol: string; symbolPosition: string; decimalPlaces: number }): string[] {
  const variants = product.variants || []
  const imageUrl = includeImages && product.imageUrls?.[0] ? product.imageUrls[0] : null
  
  if (variants.length === 0) {
    return [`
      <tr class="product-table-row">
        ${includeImages ? `
          <td>
            ${imageUrl ? 
              `<div class="table-image-wrapper"><img src="${imageUrl}" alt="${product.title}" class="product-table-image" onerror="this.style.display='none'" /></div>` : 
              `<div class="table-image-wrapper"><div class="product-table-image no-image-placeholder">-</div></div>`
            }
          </td>
        ` : ''}
        <td class="product-table-title">${product.title}</td>
        <td class="variant-name-cell">-</td>
        <td class="product-table-sku">-</td>
        <td>${product.vendor || '-'}</td>
        <td class="product-table-stock">0</td>
        <td class="product-table-price">-</td>
      </tr>
    `]
  }

  // Products with single variant
  if (variants.length === 1) {
    const variant = variants[0]
    const price = variant.prices?.[0]?.price || 0

    return [`
      <tr class="product-table-row">
        ${includeImages ? `
          <td>
            ${imageUrl ? 
              `<div class="table-image-wrapper"><img src="${imageUrl}" alt="${product.title}" class="product-table-image" onerror="this.style.display='none'" /></div>` : 
              `<div class="table-image-wrapper"><div class="product-table-image no-image-placeholder">-</div></div>`
            }
          </td>
        ` : ''}
        <td class="product-table-title">${product.title}</td>
        <td class="variant-name-cell">${variant.title}</td>
        <td class="product-table-sku">${variant.sku || '-'}</td>
        <td>${product.vendor || '-'}</td>
        <td class="product-table-stock">${variant.inventoryQuantity || 0}</td>
        <td class="product-table-price">${formatPrice(price, currency)}</td>
      </tr>
    `]
  }

  // Products with multiple variants
  return variants.map((variant, index) => {
    const price = variant.prices?.[0]?.price || 0
    const isFirst = index === 0

    return `
      <tr class="product-table-row">
        ${includeImages && isFirst ? `
          <td rowspan="${variants.length}">
            ${imageUrl ? 
              `<div class="table-image-wrapper"><img src="${imageUrl}" alt="${product.title}" class="product-table-image" onerror="this.style.display='none'" /></div>` : 
              `<div class="table-image-wrapper"><div class="product-table-image no-image-placeholder">-</div></div>`
            }
          </td>
        ` : includeImages && !isFirst ? '' : ''}
        ${isFirst ? `<td class="product-table-title" rowspan="${variants.length}">${product.title}</td>` : ''}
        <td class="variant-name-cell">${variant.title}</td>
        <td class="product-table-sku">${variant.sku || '-'}</td>
        ${isFirst ? `<td rowspan="${variants.length}">${product.vendor || '-'}</td>` : ''}
        <td class="product-table-stock">${variant.inventoryQuantity || 0}</td>
        <td class="product-table-price">${formatPrice(price, currency)}</td>
      </tr>
    `
  })
}
