import { Product } from '@/types/product'
import { ProductVariant } from '@/types/productVariant'
import { translateEnum } from '@/lib/translations'

/**
 * Obtiene todas las monedas únicas de una lista de productos
 */
function getAllCurrencies(products: Product[]): string[] {
  const currencySet = new Set<string>()
  
  products.forEach(product => {
    product.variants.forEach(variant => {
      variant.prices?.forEach(price => {
        if (price.currency?.code) {
          currencySet.add(price.currency.code)
        }
      })
    })
  })
  
  return Array.from(currencySet).sort()
}

/**
 * Obtiene el precio mínimo de un producto para una moneda específica
 */
function getMinPriceForCurrency(product: Product, currencyCode: string): number {
  let minPrice = Infinity
  
  product.variants.forEach(variant => {
    variant.prices?.forEach(price => {
      if (price.currency?.code === currencyCode) {
        const priceValue = Number(price.price || 0)
        if (priceValue > 0 && priceValue < minPrice) {
          minPrice = priceValue
        }
      }
    })
  })
  
  return minPrice === Infinity ? 0 : minPrice
}

/**
 * Formatea productos como filas de productos (una fila por producto)
 * Incluye precios para todas las monedas disponibles
 */
export function formatProductsAsProducts(products: Product[]) {
  // Obtener todas las monedas únicas
  const allCurrencies = getAllCurrencies(products)
  
  return products.map(product => {
    // Calcular stock total
    const totalStock = product.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0)

    // Obtener categorías como string separado por comas
    const categories = product.categories?.map(c => c.name).join(', ') || ''

    // Obtener colecciones como string separado por comas
    const collections = product.collections?.map(c => c.title).join(', ') || ''

    // Construir objeto base
    const baseRow: any = {
      id: product.id,
      titulo: product.title,
      slug: product.slug,
      descripcion: product.description || '',
      vendor: product.vendor || '',
      estado: translateEnum(product.status) || product.status,
      categorias: categories,
      colecciones: collections,
      stockTotal: totalStock,
      numeroVariantes: product.variants.length,
      permitirPedidoAtrasado: product.allowBackorder ? 'Sí' : 'No',
      fechaCreacion: new Date(product.createdAt).toLocaleDateString('es-ES'),
      fechaActualizacion: new Date(product.updatedAt).toLocaleDateString('es-ES'),
    }

    // Agregar precio mínimo para cada moneda
    allCurrencies.forEach(currencyCode => {
      const minPrice = getMinPriceForCurrency(product, currencyCode)
      baseRow[`precioMinimo_${currencyCode}`] = minPrice > 0 ? minPrice : ''
    })

    return baseRow
  })
}

/**
 * Genera headers dinámicos para exportación de productos
 * Incluye una columna de precio mínimo para cada moneda encontrada
 */
export function getProductHeaders(products: Product[]): Array<{ key: string; label: string }> {
  const allCurrencies = getAllCurrencies(products)
  
  const baseHeaders = [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'slug', label: 'Slug' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'vendor', label: 'Proveedor' },
    { key: 'estado', label: 'Estado' },
    { key: 'categorias', label: 'Categorías' },
    { key: 'colecciones', label: 'Colecciones' },
  ]

  // Agregar headers dinámicos para cada moneda
  const currencyHeaders = allCurrencies.map(currencyCode => ({
    key: `precioMinimo_${currencyCode}`,
    label: `Precio Mínimo (${currencyCode})`
  }))

  const restHeaders = [
    { key: 'stockTotal', label: 'Stock Total' },
    { key: 'numeroVariantes', label: 'Número de Variantes' },
    { key: 'permitirPedidoAtrasado', label: 'Permitir Pedido Atrasado' },
    { key: 'fechaCreacion', label: 'Fecha de Creación' },
    { key: 'fechaActualizacion', label: 'Última Actualización' },
  ]

  return [...baseHeaders, ...currencyHeaders, ...restHeaders]
}

/**
 * Headers estáticos para exportación de productos (fallback)
 */
export const PRODUCT_HEADERS = [
  { key: 'id', label: 'ID' },
  { key: 'titulo', label: 'Título' },
  { key: 'slug', label: 'Slug' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'vendor', label: 'Proveedor' },
  { key: 'estado', label: 'Estado' },
  { key: 'categorias', label: 'Categorías' },
  { key: 'colecciones', label: 'Colecciones' },
  { key: 'stockTotal', label: 'Stock Total' },
  { key: 'numeroVariantes', label: 'Número de Variantes' },
  { key: 'permitirPedidoAtrasado', label: 'Permitir Pedido Atrasado' },
  { key: 'fechaCreacion', label: 'Fecha de Creación' },
  { key: 'fechaActualizacion', label: 'Última Actualización' },
]

/**
 * Formatea productos como filas de variantes (una fila por variante)
 * Incluye precios para todas las monedas disponibles
 */
export function formatProductsAsVariants(products: Product[]) {
  const rows: any[] = []
  const allCurrencies = getAllCurrencies(products)

  products.forEach(product => {
    product.variants.forEach(variant => {
      // Obtener opciones de la variante desde attributes
      const attributes = variant.attributes || {}
      const option1 = attributes.option1 || attributes.talla || attributes.size || ''
      const option2 = attributes.option2 || attributes.color || ''
      const option3 = attributes.option3 || ''

      // Construir objeto base
      const baseRow: any = {
        productoId: product.id,
        productoTitulo: product.title,
        productoSlug: product.slug,
        vendor: product.vendor || '',
        sku: variant.sku || '',
        opcion1: option1,
        opcion2: option2,
        opcion3: option3,
        stock: variant.inventoryQuantity || 0,
        peso: variant.weightValue || '',
        fechaCreacion: new Date(variant.createdAt).toLocaleDateString('es-ES'),
      }

      // Agregar precio para cada moneda disponible
      allCurrencies.forEach(currencyCode => {
        const priceData = variant.prices?.find(p => p.currency?.code === currencyCode)
        if (priceData) {
          baseRow[`precio_${currencyCode}`] = Number(priceData.price || 0)
          if (priceData.originalPrice) {
            baseRow[`precioOriginal_${currencyCode}`] = Number(priceData.originalPrice)
          } else {
            baseRow[`precioOriginal_${currencyCode}`] = ''
          }
        } else {
          baseRow[`precio_${currencyCode}`] = ''
          baseRow[`precioOriginal_${currencyCode}`] = ''
        }
      })

      rows.push(baseRow)
    })
  })

  return rows
}

/**
 * Genera headers dinámicos para exportación de variantes
 * Incluye columnas de precio y precio original para cada moneda encontrada
 */
export function getVariantHeaders(products: Product[]): Array<{ key: string; label: string }> {
  const allCurrencies = getAllCurrencies(products)
  
  const baseHeaders = [
    { key: 'productoId', label: 'Producto ID' },
    { key: 'productoTitulo', label: 'Producto' },
    { key: 'productoSlug', label: 'Producto Slug' },
    { key: 'vendor', label: 'Proveedor' },
    { key: 'sku', label: 'SKU' },
    { key: 'opcion1', label: 'Opción 1' },
    { key: 'opcion2', label: 'Opción 2' },
    { key: 'opcion3', label: 'Opción 3' },
  ]

  // Agregar headers dinámicos para cada moneda (precio y precio original)
  const currencyHeaders: Array<{ key: string; label: string }> = []
  allCurrencies.forEach(currencyCode => {
    currencyHeaders.push(
      { key: `precio_${currencyCode}`, label: `Precio (${currencyCode})` },
      { key: `precioOriginal_${currencyCode}`, label: `Precio Original (${currencyCode})` }
    )
  })

  const restHeaders = [
    { key: 'stock', label: 'Stock' },
    { key: 'peso', label: 'Peso' },
    { key: 'fechaCreacion', label: 'Fecha de Creación' },
  ]

  return [...baseHeaders, ...currencyHeaders, ...restHeaders]
}

/**
 * Headers estáticos para exportación de variantes (fallback)
 */
export const VARIANT_HEADERS = [
  { key: 'productoId', label: 'Producto ID' },
  { key: 'productoTitulo', label: 'Producto' },
  { key: 'productoSlug', label: 'Producto Slug' },
  { key: 'vendor', label: 'Proveedor' },
  { key: 'sku', label: 'SKU' },
  { key: 'opcion1', label: 'Opción 1' },
  { key: 'opcion2', label: 'Opción 2' },
  { key: 'opcion3', label: 'Opción 3' },
  { key: 'stock', label: 'Stock' },
  { key: 'peso', label: 'Peso' },
  { key: 'requiereEnvio', label: 'Requiere Envío' },
  { key: 'gravable', label: 'Gravable' },
  { key: 'codigoBarras', label: 'Código de Barras' },
  { key: 'fechaCreacion', label: 'Fecha de Creación' },
]

